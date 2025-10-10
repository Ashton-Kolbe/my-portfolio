"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiUpload } from "react-icons/fi";

const COLORS_PROJECTS = ["#84A98C", "#52796F", "#354F52", "#2F3E46"];
const COLORS_QUALIFICATIONS = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464"];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newQualificationName, setNewQualificationName] = useState("");

  const projectInputRef = useRef(null);
  const qualificationInputRef = useRef(null);

  // About & Contact
  const [about, setAbout] = useState({ description_url: "", descriptionText: "", quote: "" });
  const [editAbout, setEditAbout] = useState(false);
  const [contact, setContact] = useState({ email: "", github: "", linkedin: "" });
  const [editContact, setEditContact] = useState(false);

  // Reply states
  const [replyOpen, setReplyOpen] = useState(null);
  const [replySubject, setReplySubject] = useState({});
  const [replyMessage, setReplyMessage] = useState({});

  // New states for Projects Section text areas
  const [projectDescription, setProjectDescription] = useState("");
  const [projectChallenges, setProjectChallenges] = useState("");
  const [projectSolutions, setProjectSolutions] = useState("");

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return router.push("/dashboard-login");
      setUser(currentUser);

      // Messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      setMessages(messagesData || []);

      // Projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", currentUser.id);
      setProjects(projectsData || []);

      // Qualifications
      const { data: qualificationsData } = await supabase
        .from("qualifications")
        .select("*")
        .eq("user_id", currentUser.id);
      setQualifications(qualificationsData || []);

      // About
      const { data: aboutData } = await supabase
        .from("about")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();
      if (aboutData) {
        let descriptionText = "";
        if (aboutData.description_url) {
          try {
            const res = await fetch(aboutData.description_url);
            descriptionText = await res.text();
          } catch (err) {
            console.log("Error fetching about text:", err);
          }
        }
        setAbout({
          description_url: aboutData.description_url || "",
          descriptionText,
          quote: aboutData.quote || "",
        });
      }

      // Contact
      const { data: contactData } = await supabase
        .from("contact")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();
      if (contactData)
        setContact({
          email: contactData.email,
          github: contactData.github,
          linkedin: contactData.linkedin,
        });
    };
    fetchUserAndData();
  }, [router]);

  // --- Projects & Qualifications ---
  const addProject = async () => {
    if (!newProjectName || !user) return alert("Enter a project name");
    const { data, error } = await supabase
      .from("projects")
      .insert([{ name: newProjectName, engagement: 0, user_id: user.id }])
      .select();
    if (error) return alert("Error adding project: " + error.message);
    setProjects((prev) => [...prev, data[0]]);
    setNewProjectName("");
  };

  const addQualification = async () => {
    if (!newQualificationName || !user) return alert("Enter a qualification name");
    const { data, error } = await supabase
      .from("qualifications")
      .insert([{ name: newQualificationName, engagement: 0, user_id: user.id }])
      .select();
    if (error) return alert("Error adding qualification: " + error.message);
    setQualifications((prev) => [...prev, data[0]]);
    setNewQualificationName("");
  };

  const deleteProject = async (id) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return alert("Error deleting project: " + error.message);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteQualification = async (id) => {
    const { error } = await supabase
      .from("qualifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return alert("Error deleting qualification: " + error.message);
    setQualifications((prev) => prev.filter((q) => q.id !== id));
  };

  // --- File upload ---
  const uploadFile = async (file, type) => {
    if (!user) return alert("User not authenticated");
    const bucket =
      type === "thumbnail"
        ? "projects-thumbnails"
        : type === "gif"
        ? "projects-gifs"
        : type === "qualification"
        ? "qualifications-bucket"
        : "projects-bucket";

    const table = type === "qualification" ? "qualifications" : "projects";

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return alert("Error uploading file: " + uploadError.message);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Only for projects we save thumbnail/gif urls
    if (type === "thumbnail" || type === "gif") {
      // Optionally you could associate this with the last created project or allow selecting which project
      alert(`${type} uploaded successfully!`);
      return;
    }

    // Default record for project or qualification
    const newRecord =
      type === "project"
        ? {
            name: file.name,
            thumbnail_url: "",
            gif_url: "",
            description: "No description yet",
            challenges: "N/A",
            solutions: "N/A",
            engagement: 0,
            user_id: user.id,
          }
        : { name: file.name, engagement: 0, user_id: user.id };

    const { data, error } = await supabase.from(table).insert([newRecord]).select();
    if (error) return alert(`Error saving ${type} record: ` + error.message);

    if (type === "project") setProjects((prev) => [data[0], ...prev]);
    else setQualifications((prev) => [data[0], ...prev]);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => uploadFile(file, type));
  };
  const handleDragOver = (e) => e.preventDefault();

  // --- About & Contact ---
  const saveAbout = async () => {
    if (!user) {
      alert("User not authenticated");
      return;
    }

    if (!about.descriptionText.trim()) {
      alert("Description cannot be empty!");
      return;
    }

    try {
      const fileName = "about.txt";
      const file = new File([about.descriptionText], fileName, { type: "text/plain" });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("about-buckets")
        .upload(`${user.id}/${fileName}`, file, {
          upsert: true,
          contentType: "text/plain",
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("about-buckets")
        .getPublicUrl(`${user.id}/${fileName}`);

      const publicUrl = urlData.publicUrl;

      const { data: upsertData, error: upsertError } = await supabase
        .from("about")
        .upsert(
          {
            user_id: user.id,
            description_url: publicUrl,
            quote: about.quote,
          },
          { onConflict: "user_id" }
        )
        .select();

      if (upsertError) throw new Error(`Database update failed: ${upsertError.message}`);

      setAbout((prev) => ({ ...prev, description_url: publicUrl }));
      setEditAbout(false);
      alert("About updated successfully!");
    } catch (err) {
      console.error("Error saving About:", err);
      alert(`Failed to update About: ${err.message || JSON.stringify(err)}`);
    }
  };

  const saveContact = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("contact")
      .upsert([{ user_id: user.id, ...contact }]);
    if (error) return alert("Error saving Contact: " + error.message);
    setEditContact(false);
    alert("Contact updated!");
  };

  // --- Reply ---
  const sendReply = (toEmail, msgId) => {
    const subject = replySubject[msgId];
    const body = replyMessage[msgId];
    if (!toEmail || !subject || !body) return alert("Fill in all fields");

    const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setReplySubject((prev) => ({ ...prev, [msgId]: "" }));
    setReplyMessage((prev) => ({ ...prev, [msgId]: "" }));
    setReplyOpen(null);
  };

  // --- Chart data ---
  const projectData = projects.map((p) => ({ name: p.name, value: p.engagement ?? 0 }));
  const totalEngagement = qualifications.reduce((sum, q) => sum + (q.engagement ?? 0), 0);
  const qualificationData = qualifications.map((q) => {
    const value = q.engagement ?? 0;
    const percentage = totalEngagement > 0 ? ((value / totalEngagement) * 100).toFixed(1) : "0";
    return { name: q.name, value, percentage };
  });
  const renderCustomLabel = ({ cx, cy, outerRadius, index }) => {
    const slice = qualificationData[index];
    if (!slice) return null;
    const y = cy + outerRadius * 0.4;
    return (
      <text
        x={cx}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "14px", fontWeight: "bold" }}
      >
        {`${slice.value} (${slice.percentage}%)`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-lightGreen pb-8">
      <header className="bg-deepBluegreen text-lightGreen shadow flex items-center justify-center h-32 w-full mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </header>
      <div className="px-8">
        {/* Stats */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="bg-darkTeal text-lightGreen p-4 rounded shadow flex-1 text-center">
            <h3 className="text-xl font-semibold">Messages</h3>
            <p className="text-2xl">{messages.length}</p>
          </div>
          <div className="bg-darkTeal text-lightGreen p-4 rounded shadow flex-1 text-center">
            <h3 className="text-xl font-semibold">Projects</h3>
            <p className="text-2xl">{projects.length}</p>
          </div>
          <div className="bg-darkTeal text-lightGreen p-4 rounded shadow flex-1 text-center">
            <h3 className="text-xl font-semibold">Qualifications</h3>
            <p className="text-2xl">{qualifications.length}</p>
          </div>
        </div>

        {/* Messages */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-deepBluegreen mb-4">Messages</h2>
          <div className="max-h-96 overflow-y-auto p-4 rounded scrollbar-thin scrollbar-thumb-mutedGreen scrollbar-track-lightGreen">
            {messages.length === 0 ? (
              <p className="text-deepBluegreen">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-lightGreen p-4 rounded mb-3 shadow border border-mutedGreen">
                  <p className="font-semibold text-deepBluegreen">{msg.name ?? "Anonymous"} ({msg.email ?? "No email"})</p>
                  <p className="text-deepBluegreen">{msg.message ?? ""}</p>
                  <p className="text-sm text-darkTeal mt-1">{new Date(msg.created_at).toLocaleString()}</p>

                  {/* Buttons */}
                  <div className="mt-2 flex gap-2">
                    {/* Reply Button */}
                    <button
                      onClick={() => setReplyOpen((prev) => prev === msg.id ? null : msg.id)}
                      className="px-3 py-1 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition"
                    >
                      Reply
                    </button>

                    {/* Mark as Read Button */}
                    <button
                      onClick={async () => {
                        if (!user) return alert("User not authenticated");
                        const { error } = await supabase
                          .from("messages")
                          .delete()
                          .eq("id", msg.id);
                        if (error) return alert("Error deleting message: " + error.message);
                        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                      }}
                      className="px-3 py-1 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition"
                    >
                      Mark as Read
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyOpen === msg.id && (
                    <div className="mt-2 p-2 border border-darkTeal rounded bg-mutedGreen flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Subject"
                        className="p-2 border border-darkTeal rounded"
                        value={replySubject[msg.id] || ""}
                        onChange={(e) =>
                          setReplySubject((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                      />
                      <textarea
                        placeholder="Message"
                        className="p-2 border border-darkTeal rounded h-24"
                        value={replyMessage[msg.id] || ""}
                        onChange={(e) =>
                          setReplyMessage((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => sendReply(msg.email, msg.id)}
                        className="px-4 py-2 bg-darkTeal text-lightGreen rounded hover:bg-deepBluegreen transition"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="mb-8 p-4 rounded border border-darkTeal bg-lightGreen">
          <h2 className="text-3xl font-bold text-deepBluegreen mb-4">About</h2>

          {!editAbout ? (
            <>
              <button
                onClick={() => setEditAbout(true)}
                className="px-4 py-2 bg-darkTeal text-lightGreen rounded hover:bg-deepBluegreen transition"
              >
                Edit
              </button>

              <div className="mt-4 whitespace-pre-wrap text-deepBluegreen">
                {about.descriptionText || "No description yet."}
              </div>
              {about.quote && (
                <p className="mt-2 font-semibold text-darkTeal">"{about.quote}"</p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea
                placeholder="Write your About description here..."
                rows={10}
                value={about.descriptionText}
                onChange={(e) =>
                  setAbout((prev) => ({ ...prev, descriptionText: e.target.value }))
                }
                className="w-full p-2 border border-gray-400 rounded text-gray-800"
              />

              <input
                type="text"
                placeholder="Quote"
                value={about.quote}
                onChange={(e) =>
                  setAbout((prev) => ({ ...prev, quote: e.target.value }))
                }
                className="p-2 border border-darkTeal rounded"
              />

              <button
                onClick={saveAbout}
                className="px-4 py-2 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition"
              >
                Save
              </button>
            </div>
          )}
        </section>  

        {/* Contact Section */}
        <section className="mb-12 p-4 rounded border border-darkTeal bg-lightGreen">
          <h2 className="text-3xl font-bold text-deepBluegreen mb-4">Contact</h2>
          {!editContact ? (
            <button
              onClick={() => setEditContact(true)}
              className="px-4 py-2 bg-darkTeal text-lightGreen rounded hover:bg-deepBluegreen transition"
            >
              Edit
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Email"
                className="p-2 border border-darkTeal rounded"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="GitHub"
                className="p-2 border border-darkTeal rounded"
                value={contact.github}
                onChange={(e) => setContact({ ...contact, github: e.target.value })}
              />
              <input
                type="text"
                placeholder="LinkedIn"
                className="p-2 border border-darkTeal rounded"
                value={contact.linkedin}
                onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
              />
              <button
                onClick={saveContact}
                className="px-4 py-2 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition"
              >
                Save
              </button>
            </div>
          )}
        </section>

        {/* Projects Section */}
          <section
            className="mb-12 p-4 rounded border border-dashed border-darkTeal bg-lightGreen"
          >
            <h2 className="text-3xl font-bold text-deepBluegreen mb-4">Projects</h2>

            {/* Project Name */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                placeholder="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="p-2 border border-darkTeal rounded flex-1"
              />
              <button
                onClick={addProject}
                className="px-4 py-2 bg-darkTeal text-lightGreen rounded hover:bg-deepBluegreen transition flex items-center gap-2"
              >
                <FiUpload /> Add
              </button>
            </div>

            {/* Thumbnail Upload */}
            <div
              className="mb-4 p-4 border-2 border-dashed border-darkTeal rounded text-center cursor-pointer"
              onDrop={(e) => handleDrop(e, "thumbnail")}
              onDragOver={(e) => e.preventDefault()}
            >
              <p className="text-darkTeal">Drag & drop thumbnail here, or click to select</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) uploadFile(e.target.files[0], "thumbnail");
                }}
              />
            </div>

            {/* GIF Upload */}
            <div
              className="mb-4 p-4 border-2 border-dashed border-darkTeal rounded text-center cursor-pointer"
              onDrop={(e) => handleDrop(e, "gif")}
              onDragOver={(e) => e.preventDefault()}
            >
              <p className="text-darkTeal">Drag & drop GIF here, or click to select</p>
              <input
                type="file"
                accept="image/gif,video/mp4"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) uploadFile(e.target.files[0], "gif");
                }}
              />
            </div>

            {/* Text Areas */}
            <div className="flex flex-col gap-4 mb-4">
              <textarea
                placeholder="Description"
                rows={4}
                className="w-full p-2 border border-darkTeal rounded"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
              <textarea
                placeholder="Difficulties / Challenges"
                rows={4}
                className="w-full p-2 border border-darkTeal rounded"
                value={projectChallenges}
                onChange={(e) => setProjectChallenges(e.target.value)}
              />
              <textarea
                placeholder="Solutions"
                rows={4}
                className="w-full p-2 border border-darkTeal rounded"
                value={projectSolutions}
                onChange={(e) => setProjectSolutions(e.target.value)}
              />
            </div>

            {/* Existing projects list */}
            <div className="flex flex-col gap-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex justify-between items-center bg-lightGreen p-2 rounded shadow border border-mutedGreen"
                >
                  <span>{project.name} (Engagement: {project.engagement})</span>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="px-2 py-1 bg-red-600 text-lightGreen rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>


        {/* Qualifications Section */}
        <section
          className="mb-12 p-4 rounded border border-dashed border-darkTeal bg-lightGreen"
          onDrop={(e) => handleDrop(e, "qualification")}
          onDragOver={handleDragOver}
        >
          <h2 className="text-3xl font-bold text-deepBluegreen mb-4">Qualifications</h2>
          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              placeholder="Qualification Name"
              value={newQualificationName}
              onChange={(e) => setNewQualificationName(e.target.value)}
              className="p-2 border border-darkTeal rounded flex-1"
            />
            <button
              onClick={addQualification}
              className="px-4 py-2 bg-darkTeal text-lightGreen rounded hover:bg-deepBluegreen transition flex items-center gap-2"
            >
              <FiUpload /> Add
            </button>
            <button
              onClick={() => qualificationInputRef.current.click()}
              className="px-4 py-2 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition flex items-center gap-2"
            >
              <FiUpload /> Upload File
            </button>
            <input
              ref={qualificationInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadFile(e.target.files[0], "qualification");
              }}
            />
          </div>
          <p className="text-sm text-darkTeal mb-4 italic">
            Drag & drop files here or use the Upload button
          </p>
          <div className="flex flex-col gap-2">
            {qualifications.map((qualification) => (
              <div
                key={qualification.id}
                className="flex justify-between items-center bg-lightGreen p-2 rounded shadow border border-mutedGreen"
              >
                <span>{qualification.name} (Engagement: {qualification.engagement})</span>
                <button
                  onClick={() => deleteQualification(qualification.id)}
                  className="px-2 py-1 bg-red-600 text-lightGreen rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Graphs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-mutedGreen p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-lightGreen mb-4">Project Engagements</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ index }) => projectData[index].name + ": " + projectData[index].value}
                >
                  {projectData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_PROJECTS[index % COLORS_PROJECTS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-mediumTeal p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-lightGreen mb-4">Qualification Engagements</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={qualificationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {qualificationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_QUALIFICATIONS[index % COLORS_QUALIFICATIONS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const index = props?.payload?.index || 0;
                    const slice = qualificationData[index];
                    if (!slice) return [value, name];
                    return [`${value} engagements (${slice.percentage}%)`, slice.name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition"
          >
            Back to Website
          </button>
        </div>
      </div>
    </div>
  );
}