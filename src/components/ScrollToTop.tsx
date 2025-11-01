import { useState, useEffect } from 'react';
import './ScrollToTop.css';

function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
            if (scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        document.addEventListener('scroll', toggleVisibility, { passive: true });

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
            document.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="맨 위로"
        >
            <span className="arrow-up">↑</span>
        </button>
    );
}

export default ScrollToTop;
