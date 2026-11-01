import client from "./client";

function extractError(err) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.status === 404) return "project not found";
  if (err.response?.status === 500) return "server error";
  if (err.message === "Network Error") return "cannot reach backend";
  return err.message || "unknown error";
}

export async function listProjects() {
  try {
    const res = await client.get("/api/projects");
    if (res.data.success === true && Array.isArray(res.data.projects)) {
      return {
        ok: true,
        projects: res.data.projects,
        count: res.data.open_id_count,
      };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: true, projects: [] };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function getProject(projectId) {
  try {
    const res = await client.get(`/api/project/${projectId}`);
    if (res.data.success === true && res.data.project) {
      return { ok: true, project: res.data.project };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "no project data" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function getArchives() {
  try {
    const res = await client.get(`/api/archives`);
    if (res.data.success === true && res.data) {
      return { ok: true, project: res.data.archives };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "no project data" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function getArchive(projectId) {
  try {
    const res = await client.get(`/api/archives/${projectId}`);
    console.log(res);
    if (res.data.success === true && res.data) {
      return { ok: true, archive: res.data.archive };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "no project data" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function createProject(payload) {
  try {
    const res = await client.post("/api/projects", payload);
    if (res.data.success === true) {
      return { ok: true };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function updateProject(projectId, payload) {
  try {
    const res = await client.patch(`/api/project/${projectId}`, payload);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function deleteProject(projectId) {
  try {
    const res = await client.delete(`/api/project/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function archiveProject(projectId) {
  try {
    const res = await client.put(`/api/archive/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function unarchiveProject(projectId) {
  try {
    const res = await client.put(`/api/unarchive/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function openProject(projectId) {
  try {
    const res = await client.get(`/api/open/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function launchProject(projectId) {
  try {
    const res = await client.get(`/api/launch/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function stopProject(projectId) {
  try {
    const res = await client.get(`/api/stop/${projectId}`);
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function getStatus(projectId) {
  try {
    const res = await client.get(`/api/status/${projectId}`);
    if (res.data.project_id && res.data.status) {
      return { ok: true, status: res.data.status };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "no status data" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}
export function streamLogs(projectId, onLine, onError) {
  const es = new EventSource(`http://localhost:3178/api/logs/${projectId}`);

  es.onmessage = (event) => {
    onLine(event.data);
  };

  es.onerror = () => {
    es.close();
    if (onError) onError("connection lost");
  };

  return () => es.close();
}

// ── Images ────────────────────────────────────────────────────────────────────

export async function uploadImage(file, domain) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);
    const res = await client.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.success === true) return { ok: true };
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: false, error: "unknown response" };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export async function getImages() {
  try {
    const res = await client.get("/files/get");
    if (res.data.success === true && Array.isArray(res.data.file)) {
      return { ok: true, files: res.data.file };
    }
    if (res.data.error) return { ok: false, error: res.data.error };
    return { ok: true, files: [] };
  } catch (err) {
    return { ok: false, error: extractError(err) };
  }
}

export function getImageUrl(fileName) {
  return `http://localhost:3178/uploads/${fileName}`;
}
