"use client";
import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <main className="flex flex-col min-h-screen pb-[88px] bg-lightGreen text-deepBluegreen relative">
      {/* Top Wave (behind content) */}
      <div className="custom-shape-divider-top-1758100230" aria-hidden="true">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            className="shape-fill wave-layer wave-layer-1"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            className="shape-fill wave-layer wave-layer-2"
          ></path>
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="shape-fill wave-layer wave-layer-3"
          ></path>
        </svg>
      </div>

      {/* Hero Section */}
      <section className="relative z-10" id="hero">
        <div className="flex flex-col md:flex-row items-center justify-between px-10 py-20 max-w-7xl mx-auto gap-10">
          {/* Text Content */}
          <div className="flex flex-col space-y-6 max-w-xl">
            <h1 className="text-5xl font-bold">Hi, I'm Ashton</h1>
            <p className="text-xl">
              Aspiring full-stack developer focused on building modern, inclusive web and AI experiences.
            </p>
            <div className="flex gap-4">
              <a
                href="#projects"
                className="px-6 py-2 bg-mutedGreen text-deepBluegreen font-semibold rounded hover:bg-darkTeal hover:text-lightGreen transition"
              >
                View Projects
              </a>
              <a
                href="#contact"
                className="px-6 py-2 border-2 bg-mutedGreen text-deepBluegreen font-semibold rounded hover:bg-mutedGreen hover:text-deepBluegreen transition"
              >
                Contact Me
              </a>
            </div>
          </div>

          {/* Portrait Image (round) */}
          <img
            src="/portrait.jpg"
            alt="Ashton Portrait"
            className="
              w-40 h-40        /* base (mobile) */
              sm:w-52 sm:h-52  /* small screens */
              md:w-64 md:h-64  /* medium screens */
              lg:w-72 lg:h-72  /* large screens */
              rounded-full shadow-xl object-cover
            "
          />
        </div>
      </section>

      <section id="about" className="bg-mutedGreen py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 md:ml-8 text-center md:text-left text-deepBluegreen">
            So who am I?
          </h2>

          {/* Image and text row - responsive layout */}
          <div className="flex flex-col justify-center md:flex-row gap-8 mb-8 items-center md:items-center w-full">
            {/* Image - hidden on mobile, shown on md and up with wider size */}
            <img 
              src="/about-image.jpg" 
              className="hidden md:block w-130 h-74 object-cover rounded flex-shrink-0"
              alt="About me"
            />
            
            {/* Text - centered on mobile, positioned more to the right on desktop */}
            <div className="flex-1 mr-10 md:ml-16">
              <p className="text-lg text-center md:text-left max-w-none md:max-w-lg">
                this is sample text this is sample text this is sample text this is sample text
              </p>
            </div>
          </div>

          {/* Second paragraph - centered on mobile, right-aligned on desktop */}
          <div className="flex justify-center md:justify-end">
            <p className="text-3xl italic text-center md:text-right md:mr-32 max-w-lg">
              this is sample text
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`footer ${isOpen ? "open" : "closed"} bg-mediumTeal border-t shadow-md`}>
        <div className="flex justify-center items-center p-4">
          <ul className="flex justify-around w-full max-w-md gap-x-6 items-center">
            <li>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  const offset = 80; // adjust for header/footer
                  const element = document.querySelector("#about");
                  if (element) {
                    const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                className="text-deepBluegreen font-semibold"
              >
                About
              </a>


            </li>
            <li>
              <a href="#projects" className="text-deepBluegreen font-semibold">
                Projects
              </a>
            </li>
            <li>
              <a href="#contact" className="text-deepBluegreen font-semibold">
                Contact
              </a>
            </li>
            <li>
              <button
                onClick={toggleMenu}
                className="text-deepBluegreen font-bold text-2xl transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                aria-expanded={isOpen}
                aria-label="Toggle footer menu"
              >
                ☰
              </button>
            </li>
          </ul>
        </div>

        {isOpen && (
          <div className="bg-mediumTeal border-t border-darkTeal p-4 space-y-6">
            <div className="flex justify-around w-full max-w-md gap-x-6 mx-auto">
              <a href="#option1" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 1
              </a>
              <a href="#option2" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 2
              </a>
              <a href="#option3" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 3
              </a>
              <a href="#option4" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 4
              </a>
            </div>
            <div className="flex justify-around w-full max-w-md gap-x-6 mx-auto">
              <a href="#option5" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 5
              </a>
              <a href="#option6" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 6
              </a>
              <a href="#option7" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 7
              </a>
              <a href="#option8" className="text-lightGreen hover:text-deepBluegreen font-semibold">
                Option 8
              </a>
            </div>
          </div>
        )}
      </footer>
    </main>
  );
}
