document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form submission handling
    const inquiryForm = document.getElementById('inquiry-form');
    const successModal = document.getElementById('success-message');
    const errorModal = document.getElementById('error-message');
    const closeBtns = document.querySelectorAll('.close');

    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const insuranceType = document.getElementById('insurance-type').value;
            
            if (!name || !email || !phone || !insuranceType) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Phone validation
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
                alert('Please enter a valid 10-digit phone number.');
                return;
            }
            
            // Simulate form submission with EmailJS
            // In a real implementation, you would use EmailJS or a similar service
            simulateFormSubmission(inquiryForm)
                .then(() => {
                    showModal(successModal);
                    inquiryForm.reset();
                })
                .catch(() => {
                    showModal(errorModal);
                });
        });
    }

    // Close modal when clicking the close button
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Function to simulate form submission (replace with actual EmailJS implementation)
    function simulateFormSubmission(form) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // 90% success rate for demo purposes
                const isSuccess = Math.random() < 0.9;
                
                if (isSuccess) {
                    resolve();
                } else {
                    reject();
                }
            }, 1500);
        });
    }

    // Function to show modal
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    // Function to hide modal
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Header scroll effect
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
            header.style.background = 'white';
        }
    });
});