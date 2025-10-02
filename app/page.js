"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Home() {
  const [activeNav, setActiveNav] = useState("about");
  const [hero, setHero] = useState(null);
  const [clickedNav, setClickedNav] = useState(null);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Fetch Hero data from Supabase
  useEffect(() => {
    const fetchHero = async () => {
      const { data, error } = await supabase
        .from("hero_section")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) console.error("Supabase fetch error:", error);
      else setHero(data);
    };
    fetchHero();
  }, []);

  // Smooth glide scroll function
  const smoothScrollTo = (targetY, duration = 600) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let startTime;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const time = timestamp - startTime;
      const percent = Math.min(time / duration, 1);
      window.scrollTo(0, startY + diff * percent);
      if (time < duration) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  };

  const scrollToSection = (id) => {
    setClickedNav(id);
    setTimeout(() => setClickedNav(null), 400);

    const element = document.getElementById(id);
    if (element) {
      const targetY = element.getBoundingClientRect().top + window.scrollY;
      smoothScrollTo(targetY, 600);
      setActiveNav(id);
    }
  };

  // Long press timer for Home button
  const holdTime = 3000; // 3 seconds
  let holdTimer = null;

  const startHoldTimer = () => {
    holdTimer = setTimeout(() => {
      router.push("/dashboard-login");
    }, holdTime);
  };

  const cancelHoldTimer = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const sendMessage = async () => {
    if (!name || !email || !message) {
      alert("Please fill in all fields!");
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{ name, email, message }]);

    if (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    } else {
      alert("Message sent!");
      setName("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#CAD2C5] text-[#2F3E46] relative pb-24">

      {/* Desktop Navbar */}
      <header className="hidden md:grid fixed top-0 left-0 right-0 bg-[#2F3E46] z-50 shadow-lg grid-cols-5 items-center px-6 py-3">
        {/* About Button */}
        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("about")}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "about" ? "flash" : ""}`}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "about" ? "flash" : ""}`}>About</span>
          </button>
        </div>

        {/* Projects Button */}
        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("projects")}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "projects" ? "flash" : ""}`}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "projects" ? "flash" : ""}`}>Projects</span>
          </button>
        </div>

        {/* Home Button (Center) */}
        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("hero")}
            onMouseDown={() => startHoldTimer()}
            onMouseUp={() => cancelHoldTimer()}
            onMouseLeave={() => cancelHoldTimer()}
            onTouchStart={() => startHoldTimer()}
            onTouchEnd={() => cancelHoldTimer()}
            className="bg-gradient-to-br from-[#52796F] to-[#354F52] rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 stroke-[#CAD2C5]"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>

        {/* Qualifications Button */}
        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("qualifications")}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "qualifications" ? "flash" : ""}`}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "qualifications" ? "flash" : ""}`}>Qualifications</span>
          </button>
        </div>

        {/* Contact Button */}
        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("contact")}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "contact" ? "flash" : ""}`}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "contact" ? "flash" : ""}`}>Contact</span>
          </button>
        </div>
      </header>



      {/* Hero Section */}
      <section id="hero" className="relative z-10">
        {/* Waves */}
        <div className="w-full overflow-hidden leading-none pt-0 md:pt-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="block w-full h-[120px]" // <-- restores original vertical height
          >
            <path
              d="M0,0 V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
              fill="#ffffff"
              className="wave-layer wave-layer-1"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
              fill="#ffffff"
              className="wave-layer wave-layer-2"
            />
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              fill="#ffffff"
              className="wave-layer wave-layer-3"
            />
          </svg>
        </div>


        <div className="flex flex-col md:flex-row items-center justify-between px-10 py-5 max-w-7xl mx-auto gap-10 bg-[#CAD2C5]">
          <div className="flex flex-col space-y-6 max-w-xl">
            <h1 className="text-5xl md:text-6xl font-bold text-[#2F3E46]">
              {hero ? `Hi, I'm ${hero.name}` : "Loading..."}
            </h1>
            <p className="text-xl md:text-2xl text-[#2F3E46]">{hero ? hero.tagline : "Loading hero description..."}</p>
            <div className="flex gap-4">
              <button
                onClick={() => scrollToSection("projects")}
                className="px-6 py-2 bg-[#84A98C] text-[#2F3E46] font-semibold rounded hover:bg-[#354F52] hover:text-[#CAD2C5] transition"
              >
                View Projects
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="px-6 py-2 border-2 bg-[#84A98C] text-[#2F3E46] font-semibold rounded hover:bg-[#84A98C] hover:text-[#2F3E46] transition"
              >
                Contact Me
              </button>
            </div>
          </div>

          {hero?.image_url && (
            <img
              src={hero.image_url}
              alt={`${hero.name} Portrait`}
              className="rounded-full shadow-xl object-cover w-72 h-72 md:w-96 md:h-96"
            />
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-[#84A98C] py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center md:text-left text-[#2F3E46]">
            So who am I?
          </h2>
          <div className="flex flex-col md:flex-row gap-8 mb-8 items-center">
            <div className="flex-1 md:ml-16">
              <p className="text-lg text-center md:text-left max-w-none md:max-w-lg">
                This is placeholder text describing yourself. Replace with real content later.
              </p>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <p className="text-3xl italic text-center md:text-right md:mr-32 max-w-lg">
              Additional short statement or quote here.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="bg-[#CAD2C5] py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#2F3E46]">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#84A98C] rounded-lg shadow-lg p-6 text-[#2F3E46]">
              <h3 className="text-2xl font-semibold mb-4">Project 1</h3>
              <p>This is a short description of Project 1.</p>
            </div>
            <div className="bg-[#84A98C] rounded-lg shadow-lg p-6 text-[#2F3E46]">
              <h3 className="text-2xl font-semibold mb-4">Project 2</h3>
              <p>This is a short description of Project 2.</p>
            </div>
            <div className="bg-[#84A98C] rounded-lg shadow-lg p-6 text-[#2F3E46]">
              <h3 className="text-2xl font-semibold mb-4">Project 3</h3>
              <p>This is a short description of Project 3.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section id="qualifications" className="bg-[#84A98C] py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#2F3E46]">Qualifications</h2>
          <div className="space-y-6">
            <div className="bg-[#CAD2C5] rounded-lg shadow-lg p-6 text-[#2F3E46]">
              <h3 className="text-2xl font-semibold mb-2">Qualification 1</h3>
              <p>Details about your qualification or achievement.</p>
            </div>
            <div className="bg-[#CAD2C5] rounded-lg shadow-lg p-6 text-[#2F3E46]">
              <h3 className="text-2xl font-semibold mb-2">Qualification 2</h3>
              <p>Details about your qualification or achievement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-[#CAD2C5] py-20 px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-[#2F3E46]">Contact Me</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <p className="text-lg mb-6 text-[#354F52]">
                I'd love to connect! Reach out via email or social media.
              </p>
              <ul className="space-y-3">
                {/* Email */}
                <li className="flex items-center gap-3 text-[#354F52]">
                  <svg className="w-5 h-5 stroke-[#52796F]" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>Email: <a href="mailto:your@email.com" className="underline hover:text-[#52796F] transition">your@email.com</a></span>
                </li>
                {/* GitHub */}
                <li className="flex items-center gap-3 text-[#354F52]">
                  <svg className="w-5 h-5 stroke-[#52796F]" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  <span>GitHub: <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#52796F] transition">github.com/yourusername</a></span>
                </li>
                {/* LinkedIn */}
                <li className="flex items-center gap-3 text-[#354F52]">
                  <svg className="w-5 h-5 stroke-[#52796F]" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  <span>LinkedIn: <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#52796F] transition">linkedin.com/in/yourusername</a></span>
                </li>
              </ul>
            </div>

            <div className="flex-1 bg-[#84A98C] text-[#2F3E46] p-6 rounded-lg shadow-lg space-y-4 w-full">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-[#52796F] rounded text-[#2F3E46]"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-[#52796F] rounded text-[#2F3E46]"
              />
              <textarea
                placeholder="Your Message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border border-[#52796F] rounded text-[#2F3E46]"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="px-6 py-2 bg-[#52796F] text-[#CAD2C5] font-semibold rounded hover:bg-[#2F3E46] transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#2F3E46] shadow-lg z-50 md:hidden">
        <div className="relative flex justify-center items-end px-5 py-3 max-w-md mx-auto">
          {/* Left Side Buttons */}
          <div className="flex-1 flex justify-left space-x-10">
            <button
              onClick={() => scrollToSection("about")}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "about" ? "flash" : ""}`}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "about" ? "flash" : ""}`}>About</span>
            </button>

            <button
              onClick={() => scrollToSection("projects")}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "projects" ? "flash" : ""}`}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "projects" ? "flash" : ""}`}>Projects</span>
            </button>
          </div>

          {/* Center Home Button */}
          <button
            onClick={() => scrollToSection("hero")}
            onMouseDown={() => startHoldTimer()}
            onMouseUp={() => cancelHoldTimer()}
            onMouseLeave={() => cancelHoldTimer()}
            onTouchStart={() => startHoldTimer()}
            onTouchEnd={() => cancelHoldTimer()}
            className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-[#52796F] to-[#354F52] rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 stroke-[#CAD2C5]"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          {/* Right Side Buttons */}
          <div className="flex-1 flex justify-end space-x-6">
            <button
              onClick={() => scrollToSection("qualifications")}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "qualifications" ? "flash" : ""}`}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "qualifications" ? "flash" : ""}`}>Qualifications</span>
            </button>

            <button
              onClick={() => scrollToSection("contact")}
              className="flex flex-col items-center gap-1 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-6 h-6 stroke-[#84A98C] nav-icon ${clickedNav === "contact" ? "flash" : ""}`}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span className={`text-xs font-medium text-[#84A98C] nav-text ${clickedNav === "contact" ? "flash" : ""}`}>Contact</span>
            </button>
          </div>
        </div>
      </nav>
    </main>
  );
}
