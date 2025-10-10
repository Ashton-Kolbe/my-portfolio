"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";


export default function Home() {
  const [activeNav, setActiveNav] = useState("about");
  const [clickedNav, setClickedNav] = useState(null);
  const router = useRouter();

  // About section state
  const [about, setAbout] = useState({ description: "", quote: "" });
  const [aboutFile, setAboutFile] = useState(null);


  // Contact section state
  const [contact, setContact] = useState({ email: "", github: "", linkedin: "" });

  // Hero section state
  const [hero, setHero] = useState(null);

  // Qualifications state
  const [qualifications, setQualifications] = useState([]);

  // Contact form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Fetch About data from Supabase
  useEffect(() => {
    const fetchAbout = async () => {
      try {
        // 1️⃣ Fetch the about record
        const { data, error } = await supabase
          .from("about")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching About:", error);
          return;
        }

        if (!data) return;

        let descriptionText = "";

        // 2️⃣ Only try to get the file if description_url exists
        if (data.description_url) {
          try {
            // Attempt to download directly (works if public)
            const { data: fileData, error: fileError } = await supabase
              .storage
              .from("about-buckets")
              .download(data.description_url);

            if (fileError) {
              // If download fails, maybe bucket is private → fallback to signed URL
              console.warn("Direct download failed, trying signed URL:", fileError.message);

              const { data: signedData, error: signedError } = await supabase
                .storage
                .from("about-buckets")
                .createSignedUrl(data.description_url, 60); // 60 sec URL

              if (signedError) {
                console.error("Error creating signed URL:", signedError.message);
              } else {
                const res = await fetch(signedData.signedUrl);
                descriptionText = await res.text();
              }
            } else {
              // Direct download worked
              descriptionText = await fileData.text();
            }
          } catch (err) {
            console.error("Unexpected error fetching description file:", err);
          }
        }

        // 3️⃣ Set the state
        setAbout({
          description_url: data.description_url || "",
          quote: data.quote || "",
          descriptionText,
        });
      } catch (err) {
        console.error("Unexpected error in fetchAbout:", err);
      }
    };

    fetchAbout();
  }, []);

  // Fetch Contact data from Supabase
  useEffect(() => {
    const fetchContact = async () => {
      const { data, error } = await supabase
        .from("contact")
        .select("*")
        .limit(1)
        .single();
      if (error) console.error("Error fetching Contact:", error);
      else if (data)
        setContact({ email: data.email, github: data.github, linkedin: data.linkedin });
    };
    fetchContact();
  }, []);

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

  // Fetch Qualifications from Supabase
  useEffect(() => {
    const fetchQualifications = async () => {
      const { data, error } = await supabase
        .from("qualifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) console.error("Error fetching qualifications:", error);
      else setQualifications(data);
    };
    fetchQualifications();
  }, []);

  // Smooth scroll to a section
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

  // Long press timer for Home button (dashboard login)
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

  const updateAbout = async () => {
    let description_url = about.description_url;

    if (aboutFile) {
      const fileExt = aboutFile.name.split(".").pop();
      const fileName = `about_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase
        .storage
        .from("about-buckets")
        .upload(fileName, aboutFile, { upsert: true });

      if (uploadError) return alert("Error uploading file: " + uploadError.message);

      description_url = fileName;
    }

    const { error } = await supabase.from("about").upsert([{
      user_id: about.user_id || crypto.randomUUID(), // ensure user_id exists
      description_url,
      quote: about.quote
    }]);

    if (error) return alert("Error saving About: " + error.message);

    let descriptionText = about.descriptionText;

    // If a new file is uploaded, read its text
    if (aboutFile) {
      descriptionText = await aboutFile.text();
    }

    setAbout({
      ...about,
      description_url,
      descriptionText,
    });

    setAboutFile(null);
    alert("About updated!");
  };


  // Send contact form message
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

  // Open certificate with engagement increment
  const openCertificate = async (id, url) => {
    if (!url) return;
    try {
      const { error } = await supabase.rpc("increment_engagement", { cert_id: id });
      if (error) console.error("Error incrementing engagement:", error);
      else console.log("Engagement incremented for certificate:", id);
    } catch (err) {
      console.error("Unexpected error incrementing engagement:", err);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
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
              className="block w-full h-[120px]"
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
        <section id="about" className="bg-[#84A98C] py-20 px-10 relative overflow-hidden flex flex-col items-center text-center">
          {/* Desktop Decorative Balls - Top Right */}
          <div className="hidden md:block absolute top-8 right-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#52796F] opacity-30"></div>
            <div className="w-12 h-12 rounded-full bg-[#52796F] opacity-40 ml-8"></div>
            <div className="w-10 h-10 rounded-full bg-[#52796F] opacity-50 ml-4"></div>
          </div>

          {/* Desktop Decorative Balls - Bottom Left */}
          <div className="hidden md:block absolute bottom-8 left-8 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#52796F] opacity-50 ml-8"></div>
            <div className="w-12 h-12 rounded-full bg-[#52796F] opacity-40 ml-4"></div>
            <div className="w-16 h-16 rounded-full bg-[#52796F] opacity-30"></div>
          </div>

          {/* Mobile Animated Border Streak */}
          <div className="md:hidden absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-4 border-transparent animate-border-streak"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-12 text-center text-[#2F3E46]">
              So who am I?
            </h2>
            <div className="flex flex-col gap-8 mb-8 items-center">
              <div className="flex justify-center">
                <p className="text-lg text-center max-w-xl whitespace-pre-line">
                  {about.descriptionText || "Loading description..."}
                </p>
              </div>
            </div>
            <div className="flex justify-center w-full">
              <p className="text-3xl italic text-center max-w-lg">
                {about.quote || "Loading quote..."}
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
            <h2 className="text-4xl font-bold mb-12 text-center text-[#2F3E46]">
              Qualifications
            </h2>

            {qualifications.length === 0 ? (
              <p className="text-center text-[#2F3E46]">
                No qualifications uploaded yet.
              </p>
            ) : (
              <div
                className={`grid gap-6 ${
                  qualifications.length === 1
                    ? "grid-cols-1 max-w-md mx-auto"
                    : qualifications.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                    : qualifications.length === 3
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : qualifications.length === 4
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                    : qualifications.length === 5
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {qualifications
                  .slice(0, qualifications.length === 5 ? 3 : qualifications.length)
                  .map((q) => (
                    <div
                      key={q.id}
                      className="bg-[#CAD2C5] rounded-lg shadow-lg p-6 text-[#2F3E46] flex flex-col"
                    >
                      {q.url ? (
                        <div
                          className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 mb-4 rounded cursor-pointer hover:scale-105 transition-transform overflow-hidden bg-gray-100"
                          onClick={() => openCertificate(q.id, q.url)} // ✅ pass both id and url
                        >
                          <iframe
                            src={`${q.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={q.name || "Qualification PDF"}
                            className="absolute inset-0 w-full h-full rounded border-0"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            <span className="text-white font-semibold text-lg">
                              Click to View Certificate
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center mb-4 rounded">
                          <span className="text-gray-500">No Preview Available</span>
                        </div>
                      )}
                      <h3 className="text-2xl font-semibold mb-2">{q.name}</h3>
                      <p className="text-gray-600">{q.description}</p>
                    </div>
                  ))}
              </div>
            )}

            {qualifications.length === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
                {qualifications.slice(3).map((q) => (
                  <div
                    key={q.id}
                    className="bg-[#CAD2C5] rounded-lg shadow-lg p-6 text-[#2F3E46] flex flex-col"
                  >
                    {q.url ? (
                      <div
                        className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 mb-4 rounded cursor-pointer hover:scale-105 transition-transform overflow-hidden bg-gray-100"
                        onClick={() => openCertificate(q.id, q.url)} // ✅ fixed here too
                      >
                        <iframe
                          src={`${q.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          title={q.name || "Qualification PDF"}
                          className="absolute inset-0 w-full h-full rounded border-0"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                          <span className="text-white font-semibold text-lg">
                            Click to View Certificate
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center mb-4 rounded">
                        <span className="text-gray-500">No Preview Available</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-semibold mb-2">{q.name}</h3>
                    <p className="text-gray-600">{q.description}</p>
                  </div>
                ))}
              </div>
            )}

            {qualifications.length > 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {qualifications
                  .slice(
                    qualifications.length === 5
                      ? 3
                      : Math.ceil(qualifications.length / 3) * 3
                  )
                  .map((q) => (
                    <div
                      key={q.id}
                      className="bg-[#CAD2C5] rounded-lg shadow-lg p-6 text-[#2F3E46] flex flex-col"
                    >
                      {q.url ? (
                        <div
                          className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 mb-4 rounded cursor-pointer hover:scale-105 transition-transform overflow-hidden bg-gray-100"
                          onClick={() => openCertificate(q.id, q.url)} // ✅ fixed here too
                        >
                          <iframe
                            src={`${q.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={q.name || "Qualification PDF"}
                            className="absolute inset-0 w-full h-full rounded border-0"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            <span className="text-white font-semibold text-lg">
                              Click to View Certificate
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center mb-4 rounded">
                          <span className="text-gray-500">No Preview Available</span>
                        </div>
                      )}
                      <h3 className="text-2xl font-semibold mb-2">{q.name}</h3>
                      <p className="text-gray-600">{q.description}</p>
                    </div>
                  ))}
              </div>
            )}
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
                  <li className="flex items-center gap-3 text-[#354F52]">
                    <FaEnvelope className="text-[#52796F]" />
                    <span>Email:&nbsp;  
                      <a href={`mailto:${contact.email}`} className="relative inline-block group">
                        {contact.email || "Loading..."}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#52796F] transition-all duration-300 group-hover:w-full"></span>
                      </a>
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-[#354F52]">
                    <FaGithub className="text-[#52796F]" />
                    <span>GitHub:&nbsp; 
                      <a href={contact.github} target="_blank" rel="noopener noreferrer" className="relative inline-block group">
                        {contact.github || "Loading..."}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#52796F] transition-all duration-300 group-hover:w-full"></span>
                      </a>
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-[#354F52]">
                    <FaLinkedin className="text-[#52796F]" />
                    <span>LinkedIn:&nbsp; 
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="relative inline-block group">
                        {contact.linkedin || "Loading..."}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#52796F] transition-all duration-300 group-hover:w-full"></span>
                      </a>
                    </span>
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
    </>
  );
}