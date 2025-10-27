import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Section = ({ title, children, showControls = true }) => { 
  const scrollContainerRef = useRef(null);

  const handleScroll = (scrollOffset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: scrollOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="section-container">
      <div className="section-header">
        <h2>{title}</h2>
      </div>

      <div className="section-scroll-container" ref={scrollContainerRef}>
        {children}
      </div>
      
      {/* Renderiza os botões de rolagem APENAS se showControls for verdade */}
      {showControls && ( 
        <>
          <button className="scroll-button left" onClick={() => handleScroll(-400)}>
            <FaChevronLeft />
          </button>
          <button className="scroll-button right" onClick={() => handleScroll(400)}>
            <FaChevronRight />
          </button>
        </>
      )}
    </section>
  );
};

export default Section;