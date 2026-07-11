let currentNovelProjectId = "";
let activeNovelJobId = "";
let novelPollTimer = null;

const novelEl = id => document.getElementById(id);

function novelMessage(message, tone = "info") {
    const box = novelEl("novel-status-text");
    if (box) {
        box.textContent = message;
        box.dataset.tone = tone;
    }
}

async function novelRequest(path, options = {}) {
    const response = await fetch(apiUrl(path), {
        ...options,
        headers: authHeaders(options.headers || {})
    });
    if (response.status === 403 && typeof handle403 === "function") {
        await handle403();
        throw new Error("로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.");
    }
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `요청 실패 (${response.status})`);
    }
    return response.json();
}

function hideAllJobButtons() {
    ["btn-novel-write-next", "btn-novel-write-all", "btn-novel-pause", "btn-novel-resume", "btn-novel-cancel"]
        .forEach(id => { if (novelEl(id)) novelEl(id).style.display = "none"; });
}

function showNoProjectDetails() {
    currentNovelProjectId = "";
    novelEl("novel-details-title").textContent = "📖 기획된 소설이 없습니다";
    novelEl("novel-details-genre").textContent = "새 소설 기획을 눌러 시작하세요.";
    novelEl("novel-chapters-list").replaceChildren();
    hideAllJobButtons();
}

async function loadNovelProjects() {
    const select = novelEl("novel-project-select");
    if (!select) return;
    select.replaceChildren(new Option("소설 목록을 불러오는 중…", ""));
    try {
        const [{ projects = [] }, active] = await Promise.all([
            novelRequest("/api/novel/projects"),
            novelRequest("/api/novel/active")
        ]);
        select.replaceChildren();
        if (!projects.length) {
            select.append(new Option("기획된 작품 없음", ""));
            showNoProjectDetails();
            return;
        }
        projects.forEach(project => {
            select.append(new Option(`${project.title} (${project.genre})`, project.project_id));
        });
        select.value = active.project_id || projects[0].project_id;
        await loadActiveProjectDetails(false);
    } catch (error) {
        novelMessage(`소설 목록 오류: ${error.message}`, "error");
    }
}

function chapterRow(chapter) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `chapter-row ${chapter.completed ? "completed" : "pending"}`;
    const title = document.createElement("span");
    title.textContent = `제 ${chapter.chapter_num}화 · ${chapter.title || "제목 없음"}`;
    const badge = document.createElement("span");
    badge.className = `chapter-badge ${chapter.completed ? "completed" : "pending"}`;
    badge.textContent = chapter.completed ? "집필 완료" : (chapter.write_status === "needs_review" ? "검토 필요" : "대기 중");
    row.append(title, badge);
    row.addEventListener("click", () => openChapterViewer(chapter.chapter_num));
    return row;
}

async function loadActiveProjectDetails(setActive = true) {
    const projectId = novelEl("novel-project-select")?.value || "";
    currentNovelProjectId = projectId;
    if (!projectId) return showNoProjectDetails();
    try {
        if (setActive) {
            await novelRequest("/api/novel/set_active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: projectId })
            });
        }
        const config = await novelRequest(`/api/novel/status?project_id=${encodeURIComponent(projectId)}`);
        novelEl("novel-details-title").textContent = `📖 ${config.title || "제목 없음"}`;
        novelEl("novel-details-genre").textContent = `장르: ${config.genre || "일반"} · 완료 ${config.completed_chapters || 0}/${config.total_chapters || 0}`;
        const list = novelEl("novel-chapters-list");
        list.replaceChildren(...(config.chapters || []).map(chapterRow));
        hideAllJobButtons();
        const { jobs = [] } = await novelRequest("/api/novel/jobs");
        const job = jobs.find(item => item.project_id === projectId) || jobs[0];
        if (job) {
            activeNovelJobId = job.job_id;
            renderNovelJob(job);
            scheduleNovelPoll();
        } else if ((config.completed_chapters || 0) < (config.total_chapters || 0)) {
            novelEl("btn-novel-write-next").style.display = "inline-flex";
            novelEl("btn-novel-write-all").style.display = "inline-flex";
            novelMessage("집필 대기 중");
        } else {
            novelMessage("모든 화의 집필이 완료되었습니다.", "success");
        }
    } catch (error) {
        novelMessage(`프로젝트 오류: ${error.message}`, "error");
    }
}

async function startWritingJob(jobType) {
    if (!currentNovelProjectId) return novelMessage("먼저 작품을 선택해 주세요.", "error");
    hideAllJobButtons();
    novelEl("novel-progress-container").style.display = "block";
    novelMessage("작업 요청 중…");
    try {
        const data = await novelRequest("/api/novel/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: currentNovelProjectId,
                job_type: jobType,
                request_key: `${currentNovelProjectId}-${jobType}-${Date.now()}`
            })
        });
        activeNovelJobId = data.job.job_id;
        renderNovelJob(data.job);
        scheduleNovelPoll(200);
    } catch (error) {
        novelMessage(`집필 시작 실패: ${error.message}`, "error");
        await loadActiveProjectDetails(false);
    }
}

function scheduleNovelPoll(delay = 1800) {
    clearTimeout(novelPollTimer);
    if (!activeNovelJobId) return;
    novelPollTimer = setTimeout(pollNovelJob, delay);
}

async function pollNovelJob() {
    try {
        const job = await novelRequest(`/api/novel/job?job_id=${encodeURIComponent(activeNovelJobId)}`);
        renderNovelJob(job);
        const terminal = ["completed", "completed_with_review", "cancelled"].includes(job.status);
        if (!terminal && job.status !== "awaiting_approval" && job.status !== "paused" && job.status !== "interrupted") {
            scheduleNovelPoll();
        }
    } catch (error) {
        novelMessage(`진행 확인 오류: ${error.message}`, "error");
        scheduleNovelPoll(4000);
    }
}

function renderNovelJob(job) {
    novelEl("novel-progress-container").style.display = "block";
    const progress = Math.max(0, Math.min(100, Number(job.progress) || 0));
    novelEl("novel-progress-bar").style.width = `${progress}%`;
    novelEl("novel-progress-text").textContent = `${progress}%`;
    const logs = novelEl("novel-logs-box");
    logs.textContent = (job.logs || []).join("\n");
    logs.scrollTop = logs.scrollHeight;
    hideAllJobButtons();

    const statusNames = {
        queued: "작업 대기 중", planning: "줄거리 기획 중", writing: `제 ${job.current_chapter || "?"}화 · 장면 ${job.current_scene || "?"} 집필 중`,
        awaiting_approval: "1/3 줄거리 승인 대기", pause_requested: "일시정지 요청 처리 중", paused: "일시정지됨",
        cancel_requested: "취소 요청 처리 중", cancelled: "취소됨", interrupted: "작업 중단됨",
        completed: "완료", completed_with_review: "완료 · 검토 항목 있음"
    };
    novelMessage(statusNames[job.status] || job.status, job.status === "interrupted" ? "error" : "info");
    if (["planning", "writing"].includes(job.status)) {
        novelEl("btn-novel-pause").style.display = "inline-flex";
        novelEl("btn-novel-cancel").style.display = "inline-flex";
    } else if (job.status === "paused" || job.status === "interrupted") {
        novelEl("btn-novel-resume").style.display = "inline-flex";
        novelEl("btn-novel-cancel").style.display = "inline-flex";
    } else if (job.status === "awaiting_approval") {
        showOutlineApprovalModal();
    } else if (["completed", "completed_with_review", "cancelled"].includes(job.status)) {
        activeNovelJobId = "";
        clearTimeout(novelPollTimer);
        setTimeout(() => loadActiveProjectDetails(false), 500);
    }
}

async function controlActiveJob(action) {
    if (!activeNovelJobId) return;
    try {
        const data = await novelRequest(`/api/novel/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: activeNovelJobId })
        });
        renderNovelJob(data.job);
        scheduleNovelPoll(500);
    } catch (error) {
        novelMessage(`작업 제어 실패: ${error.message}`, "error");
    }
}

async function showOutlineApprovalModal() {
    try {
        const config = await novelRequest(`/api/novel/status?project_id=${encodeURIComponent(currentNovelProjectId)}`);
        const outline = typeof config.outline_3rd === "string" ? config.outline_3rd : (config.outline_3rd?.outline_text || "줄거리를 불러오지 못했습니다.");
        novelEl("outline-approval-text").textContent = outline;
        novelEl("outline-approval-modal").style.display = "flex";
    } catch (error) {
        novelMessage(`줄거리 표시 오류: ${error.message}`, "error");
    }
}

async function respondToOutline(action) {
    novelEl("outline-approval-modal").style.display = "none";
    const endpoint = action === "approve" ? "approve" : "reject";
    try {
        const data = await novelRequest(`/api/novel/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: activeNovelJobId })
        });
        renderNovelJob(data.job);
        scheduleNovelPoll(500);
    } catch (error) {
        novelMessage(`승인 처리 실패: ${error.message}`, "error");
    }
}

function openNewProjectModal() {
    ["new-project-title", "new-project-genre", "new-project-prompt"].forEach(id => { novelEl(id).value = ""; });
    novelEl("new-project-modal").style.display = "flex";
}

function closeNewProjectModal() {
    novelEl("new-project-modal").style.display = "none";
}

async function submitNewProject() {
    const title = novelEl("new-project-title").value.trim();
    const genre = novelEl("new-project-genre").value.trim();
    const idea = novelEl("new-project-prompt").value.trim();
    if (!title || !genre || idea.length < 10) return novelMessage("제목, 장르, 10자 이상의 아이디어를 입력해 주세요.", "error");
    closeNewProjectModal();
    novelMessage("새 소설 기획 작업을 등록하는 중…");
    try {
        const data = await novelRequest("/api/novel/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, genre, idea, request_key: `create-${Date.now()}` })
        });
        activeNovelJobId = data.job.job_id;
        renderNovelJob(data.job);
        scheduleNovelPoll(300);
    } catch (error) {
        novelMessage(`새 소설 생성 실패: ${error.message}`, "error");
    }
}

async function openChapterViewer(chapterNum) {
    let modal = novelEl("novel-document-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "novel-document-modal";
        modal.className = "modal-overlay";
        const card = document.createElement("div");
        card.className = "modal-content glass-card novel-document-card";
        const controls = document.createElement("div");
        controls.className = "novel-document-controls";
        const draftButton = document.createElement("button");
        draftButton.className = "action-btn-primary";
        draftButton.textContent = "원고";
        const reportButton = document.createElement("button");
        reportButton.className = "action-btn-warning";
        reportButton.textContent = "품질 보고서";
        const closeButton = document.createElement("button");
        closeButton.className = "action-btn-danger";
        closeButton.textContent = "닫기";
        closeButton.onclick = () => { modal.style.display = "none"; };
        const content = document.createElement("pre");
        content.id = "novel-document-content";
        controls.append(draftButton, reportButton, closeButton);
        card.append(controls, content);
        modal.append(card);
        document.body.append(modal);
        draftButton.onclick = () => loadChapterDocument(chapterNum, "draft");
        reportButton.onclick = () => loadChapterDocument(chapterNum, "report");
    }
    modal.style.display = "flex";
    await loadChapterDocument(chapterNum, "draft");
}

async function loadChapterDocument(chapterNum, type) {
    const content = novelEl("novel-document-content");
    content.textContent = "불러오는 중…";
    try {
        const data = await novelRequest(`/api/novel/chapter?project_id=${encodeURIComponent(currentNovelProjectId)}&chapter_num=${chapterNum}&type=${type}`);
        content.textContent = data.content;
    } catch (error) {
        content.textContent = `문서를 불러오지 못했습니다: ${error.message}`;
    }
}
