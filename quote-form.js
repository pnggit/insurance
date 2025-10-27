document.addEventListener('DOMContentLoaded', function() {
    // Initialize the form
    initializeForm();
    
    // Set up event listeners
    setupEventListeners();
});

function initializeForm() {
    // Hide all dynamic fields initially
    const dynamicFields = document.querySelectorAll('.dynamic-fields');
    dynamicFields.forEach(field => {
        field.classList.remove('active');
    });
    
    // Add validation attributes to required fields
    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    requiredInputs.forEach(input => {
        // Add aria attributes for accessibility
        input.setAttribute('aria-required', 'true');
        
        // Create error message element
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.id = `${input.id}-error`;
        errorMessage.setAttribute('aria-live', 'polite');
        
        // Insert error message after input
        input.parentNode.insertBefore(errorMessage, input.nextSibling);
    });
}

function setupEventListeners() {
    // Insurance type selection
    const insuranceOptions = document.querySelectorAll('.insurance-type-option');
    insuranceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            insuranceOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value
            const insuranceType = this.getAttribute('data-type');
            document.getElementById('selected-insurance-type').value = insuranceType;
            
            // Show corresponding dynamic fields
            showDynamicFields(insuranceType);
        });
    });
    
    // Form submission
    const form = document.getElementById('insurance-quote-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (validateForm()) {
            // Submit form data (in a real app, this would send data to a server)
            submitForm();
        }
    });
    
    // Modal close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal, .modal-close');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('success-modal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

function showDynamicFields(insuranceType) {
    // Hide all dynamic fields
    const dynamicFields = document.querySelectorAll('.dynamic-fields');
    dynamicFields.forEach(field => {
        field.classList.remove('active');
    });
    
    // Show selected insurance type fields
    const selectedFields = document.getElementById(`${insuranceType}-fields`);
    if (selectedFields) {
        selectedFields.classList.add('active');
    }
}

function validateForm() {
    let isValid = true;
    
    // Check if insurance type is selected
    const insuranceType = document.getElementById('selected-insurance-type').value;
    if (!insuranceType) {
        isValid = false;
        alert('Please select an insurance type');
        return false;
    }
    
    // Validate required fields
    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    requiredInputs.forEach(input => {
        const errorElement = document.getElementById(`${input.id}-error`);
        
        // Reset previous errors
        input.classList.remove('error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        // Check if field is empty
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = 'This field is required';
                errorElement.style.display = 'block';
            }
        } else if (input.type === 'email' && !validateEmail(input.value)) {
            // Validate email format
            isValid = false;
            input.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid email address';
                errorElement.style.display = 'block';
            }
        } else if (input.id === 'phone' && !validatePhone(input.value)) {
            // Validate phone format
            isValid = false;
            input.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid phone number';
                errorElement.style.display = 'block';
            }
        } else if (input.id === 'zip' && !validateZip(input.value)) {
            // Validate ZIP code format
            isValid = false;
            input.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid ZIP code';
                errorElement.style.display = 'block';
            }
        }
    });
    
    // Validate dynamic fields based on insurance type
    if (insuranceType === 'auto') {
        // Validate auto insurance specific fields
        const vehicleYear = document.getElementById('auto-year').value;
        if (vehicleYear && (vehicleYear < 1900 || vehicleYear > new Date().getFullYear() + 1)) {
            isValid = false;
            document.getElementById('auto-year').classList.add('error');
            const errorElement = document.getElementById('auto-year-error');
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid vehicle year';
                errorElement.style.display = 'block';
            }
        }
    } else if (insuranceType === 'home') {
        // Validate home insurance specific fields
        const homeYear = document.getElementById('home-year').value;
        if (homeYear && (homeYear < 1800 || homeYear > new Date().getFullYear())) {
            isValid = false;
            document.getElementById('home-year').classList.add('error');
            const errorElement = document.getElementById('home-year-error');
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid year built';
                errorElement.style.display = 'block';
            }
        }
    }
    
    return isValid;
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(String(phone));
}

function validateZip(zip) {
    const re = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
    return re.test(String(zip));
}

function submitForm() {
    // In a real application, this would send the data to a server
    // For this demo, we'll just show a success message
    
    // Get form data
    const form = document.getElementById('insurance-quote-form');
    const formData = new FormData(form);
    
    // Log form data (for demonstration purposes)
    console.log('Form submitted with the following data:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    // Show success modal
    showModal();
    
    // Reset form
    form.reset();
    
    // Reset insurance type selection
    const insuranceOptions = document.querySelectorAll('.insurance-type-option');
    insuranceOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Hide dynamic fields
    const dynamicFields = document.querySelectorAll('.dynamic-fields');
    dynamicFields.forEach(field => {
        field.classList.remove('active');
    });
}

function showModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
}