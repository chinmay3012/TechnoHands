document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Gemini API elements
    const industryInput = document.getElementById('industry-input');
    const generateInsightsButton = document.getElementById('generate-insights-button');
    const insightsOutput = document.getElementById('insights-output');
    const loadingSpinner = document.getElementById('loading-spinner');

    /**
     * Shows the specified section and updates the active navigation link.
     * @param {string} id The ID of the section to show.
     */
    const showSection = (id) => {
        sections.forEach(section => {
            if (section.id === id) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            if (link.dataset.section === id) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            // Scroll to the section with an offset for the fixed header
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                const headerOffset = document.querySelector('header').offsetHeight;
                const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: elementPosition - headerOffset,
                    behavior: 'smooth'
                });
            }
            // Close mobile menu after clicking a link
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Toggle mobile menu visibility
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Set initial active section based on URL hash or default to 'home'
    const initialHash = window.location.hash ? window.location.hash.substring(1) : 'home';
    showSection(initialHash);

    // Optional: Update active nav link on scroll (for desktop experience)
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Adjust this to control when section becomes active
        threshold: 0 // Threshold doesn't matter much with rootMargin
    };

    const fadeInSections = document.querySelectorAll('.fade-in');

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    fadeInSections.forEach(section => {
        fadeObserver.observe(section);
    });
    

    sections.forEach(section => {
        observer.observe(section);
    });

    // Gemini API Integration Logic
    generateInsightsButton.addEventListener('click', async () => {
        const industry = industryInput.value.trim();
        if (!industry) {
            insightsOutput.innerHTML = '<p class="text-red-400">Please enter an industry to generate insights.</p>';
            return;
        }

        insightsOutput.innerHTML = ''; // Clear previous content
        loadingSpinner.classList.remove('hidden'); // Show spinner
        generateInsightsButton.disabled = true; // Disable button

        try {
            let chatHistory = [];
            const prompt = `Explain how precision manufacturing (like CNC machining, VMC) impacts the ${industry} industry. Focus on the benefits and applications. Keep the response concise, professional, and around 150-200 words.`;
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will provide this at runtime
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                insightsOutput.innerHTML = `<p>${text}</p>`;
            } else {
                insightsOutput.innerHTML = '<p class="text-red-400">Could not generate insights. Please try again.</p>';
                console.error('Gemini API response structure unexpected:', result);
            }
        } catch (error) {
            insightsOutput.innerHTML = `<p class="text-red-400">An error occurred: ${error.message}. Please try again later.</p>`;
            console.error('Error calling Gemini API:', error);
        } finally {
            loadingSpinner.classList.add('hidden'); // Hide spinner
            generateInsightsButton.disabled = false; // Enable button
        }
    });
});
