document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const yearSelect = document.getElementById('year-select');
    const semesterSelect = document.getElementById('semester-select');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const syllabusGrid = document.getElementById('syllabus-grid');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');

    // Modal Elements
    const uploadModal = document.getElementById('upload-modal');
    const openUploadBtn = document.getElementById('open-upload-modal');
    const closeBtn = document.querySelector('.close-btn');
    const uploadForm = document.getElementById('upload-form');
    const uploadFeedback = document.getElementById('upload-feedback');
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('span');
    const spinner = submitBtn.querySelector('.spinner');

    // Fetch and display initial data
    fetchSyllabuses();

    // Event Listeners
    applyFiltersBtn.addEventListener('click', () => {
        const year = yearSelect.value;
        const semester = semesterSelect.value;
        fetchSyllabuses(year, semester);
    });

    // Modal open/close logic
    openUploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
        uploadFeedback.classList.add('hidden');
        uploadForm.reset();
    });

    closeBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('pdf-file');
        const file = fileInput.files[0];
        
        if (file && file.type !== 'application/pdf') {
            showFeedback('Only PDF files are allowed.', 'error');
            return;
        }

        const formData = new FormData(uploadForm);
        
        // Show loading state
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/syllabus/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                showFeedback(data.message, 'success');
                uploadForm.reset();
                // Refresh data
                fetchSyllabuses(yearSelect.value, semesterSelect.value);
                
                // Auto close modal after positive feedback
                setTimeout(() => {
                    uploadModal.classList.add('hidden');
                }, 2000);
            } else {
                showFeedback(data.error || 'Upload failed.', 'error');
            }
        } catch (err) {
            showFeedback('An error occurred during upload. Check server.', 'error');
            console.error(err);
        } finally {
            // Restore button
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    // Helper Functions
    async function fetchSyllabuses(year = '', semester = '') {
        // Build query string
        let url = '/api/syllabus';
        if (year || semester) {
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            if (semester) params.append('semester', semester);
            url += '?' + params.toString();
        }

        // UI States
        syllabusGrid.innerHTML = '';
        loader.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorMessage.classList.add('hidden');

        try {
            // Add a small delay for smoother UI feel
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch data');
            
            const data = await res.json();
            
            loader.classList.add('hidden');
            
            if (data.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                renderSyllabuses(data);
            }
        } catch (err) {
            loader.classList.add('hidden');
            errorMessage.textContent = 'Error loading syllabus data. Please try again later.';
            errorMessage.classList.remove('hidden');
            console.error(err);
        }
    }

    function renderSyllabuses(data) {
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Format year with ordinal suffix (e.g. 1st, 2nd)
            const getYearString = (y) => {
                const map = {1: '1st', 2: '2nd', 3: '3rd', 4: '4th'};
                return map[y] || y + 'th';
            };

            card.innerHTML = `
                <div class="card-badge">${getYearString(item.year)} Year • Sem ${item.semester}</div>
                <h3 class="card-title">${item.subject_name}</h3>
                <div class="card-meta">Added: ${new Date(item.created_at).toLocaleDateString()}</div>
                <div class="card-action">
                    <a href="${item.pdf_path}" target="_blank">View PDF</a>
                </div>
            `;
            
            syllabusGrid.appendChild(card);
        });
    }

    function showFeedback(msg, type) {
        uploadFeedback.textContent = msg;
        uploadFeedback.className = 'feedback ' + type;
        uploadFeedback.classList.remove('hidden');
    }
});
