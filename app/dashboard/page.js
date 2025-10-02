"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { FiUpload } from "react-icons/fi";

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

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return router.push("/dashboard-login");
      setUser(currentUser);

      // Fetch user-specific messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      setMessages(messagesData || []);

      // Fetch projects and qualifications scoped to user
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", currentUser.id);
      setProjects(projectsData || []);

      const { data: qualificationsData } = await supabase
        .from("qualifications")
        .select("*")
        .eq("user_id", currentUser.id);
      setQualifications(qualificationsData || []);
    };
    fetchUserAndData();
  }, [router]);

  // --- Add Project/Qualification ---
  const addProject = async () => {
    if (!newProjectName || !user) return alert("Enter a project name");
    
    console.log("Uploading project for user:", user);
    
    const { data, error } = await supabase
      .from("projects")
      .insert([{ name: newProjectName, engagement: 0, user_id: user.id }])
      .select();
      
    if (error) {
      console.error("Error adding project:", error);
      return alert("Error adding project: " + error.message);
    }
    
    setProjects((prev) => [...prev, data[0]]);
    setNewProjectName("");
  };

  const addQualification = async () => {
    if (!newQualificationName || !user) return alert("Enter a qualification name");
    
    const { data, error } = await supabase
      .from("qualifications")
      .insert([{ name: newQualificationName, engagement: 0, user_id: user.id }])
      .select();
      
    if (error) {
      console.error("Error adding qualification:", error);
      return alert("Error adding qualification: " + error.message);
    }
    
    setQualifications((prev) => [...prev, data[0]]);
    setNewQualificationName("");
  };

  // --- Delete ---
  const deleteProject = async (id) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error deleting project:", error);
      return alert("Error deleting project: " + error.message);
    }
    
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteQualification = async (id) => {
    const { error } = await supabase
      .from("qualifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error deleting qualification:", error);
      return alert("Error deleting qualification: " + error.message);
    }
    
    setQualifications((prev) => prev.filter((q) => q.id !== id));
  };

  // --- Upload Files ---
  const uploadFile = async (file, type) => {
    if (!user) {
      alert("User not authenticated");
      return;
    }
    
    const bucket = type === "project" ? "projects-bucket" : "qualifications-bucket";
    const table = type === "project" ? "projects" : "qualifications";

    console.log(`Uploading ${type} file:`, file.name, "for user:", user.id);

    // Upload to storage under user namespace
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`${user.id}/${file.name}`, file, { upsert: true });
      
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return alert("Error uploading file: " + uploadError.message);
    }

    // Insert record into table
    const { data, error } = await supabase
      .from(table)
      .insert([{ name: file.name, engagement: 0, user_id: user.id }])
      .select();
      
    if (error) {
      console.error("Database insert error:", error);
      return alert("Error saving file record: " + error.message);
    }

    if (type === "project") {
      setProjects((prev) => [...prev, data[0]]);
    } else {
      setQualifications((prev) => [...prev, data[0]]);
    }
    
    alert(`${type === "project" ? "Project" : "Qualification"} uploaded successfully!`);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => uploadFile(file, type));
  };
  
  const handleDragOver = (e) => e.preventDefault();

  // --- Chart data ---
  const projectData = projects.map((p) => ({ name: p.name, value: p.engagement ?? 0 }));
  const qualificationData = qualifications.map((q) => ({ name: q.name, value: q.engagement ?? 0 }));

  const COLORS_PROJECTS = ["#84A98C", "#52796F", "#354F52", "#2F3E46"];
  const COLORS_QUALIFICATIONS = ["#52796F", "#354F52", "#84A98C", "#2F3E46"];

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
                <div
                  key={msg.id}
                  className="bg-lightGreen p-4 rounded mb-3 shadow border border-mutedGreen"
                >
                  <p className="font-semibold text-deepBluegreen">
                    {msg.name ?? "Anonymous"} ({msg.email ?? "No email"})
                  </p>
                  <p className="text-deepBluegreen">{msg.message ?? ""}</p>
                  <p className="text-sm text-darkTeal mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Projects Section */}
        <section
          className="mb-12 p-4 rounded border border-dashed border-darkTeal bg-lightGreen"
          onDrop={(e) => handleDrop(e, "project")}
          onDragOver={handleDragOver}
        >
          <h2 className="text-3xl font-bold text-deepBluegreen mb-4">Projects</h2>
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
            <button
              onClick={() => projectInputRef.current.click()}
              className="px-4 py-2 bg-mediumTeal text-lightGreen rounded hover:bg-darkTeal transition flex items-center gap-2"
            >
              <FiUpload /> Upload File
            </button>
            <input
              ref={projectInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadFile(e.target.files[0], "project");
              }}
            />
          </div>
          <p className="text-sm text-darkTeal mb-4 italic">
            Drag & drop files here or use the Upload button
          </p>
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
            <PieChart width={250} height={250}>
              <Pie
                data={projectData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {projectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PROJECTS[index % COLORS_PROJECTS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
          <div className="bg-mediumTeal p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-lightGreen mb-4">Qualification Engagements</h2>
            <PieChart width={250} height={250}>
              <Pie
                data={qualificationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {qualificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_QUALIFICATIONS[index % COLORS_QUALIFICATIONS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </section>

        {/* Back */}
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