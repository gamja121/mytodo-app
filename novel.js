let currentNovelProjectId = "";
let currentNovelTitle = "";
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
    ["btn-novel-write-next", "btn-novel-write-all", "btn-novel-pause", "btn-novel-resume", "btn-novel-cancel", "btn-novel-replan"]
        .forEach(id => { if (novelEl(id)) novelEl(id).style.display = "none"; });
}

function ensureNovelReplanButton() {
    let button = novelEl("btn-novel-replan");
    if (button) return button;
    const deleteButton = novelEl("btn-novel-delete");
    if (!deleteButton?.parentElement) return null;
    button = document.createElement("button");
    button.id = "btn-novel-replan";
    button.className = "action-btn-primary";
    button.textContent = "기획 보완 후 집필 준비";
    button.style.cssText = "display:none;margin-top:8px;width:100%;";
    button.addEventListener("click", startNovelReplan);
    deleteButton.insertAdjacentElement("afterend", button);
    return button;
}

function showNoProjectDetails() {
    currentNovelProjectId = "";
    currentNovelTitle = "";
    novelEl("novel-details-title").textContent = "📖 기획된 소설이 없습니다";
    novelEl("novel-details-genre").textContent = "새 소설 기획을 눌러 시작하세요.";
    novelEl("novel-chapters-list").replaceChildren();
    hideAllJobButtons();
    if (novelEl("btn-novel-delete")) novelEl("btn-novel-delete").style.display = "none";
}

async function loadNovelProjects() {
    const select = novelEl("novel-project-select");
    if (!select) return;
    select.replaceChildren(new Option("소설 목록을 불러오는 중…", ""));
    try {
        const [{ projects = [] }, active, { jobs = [] }] = await Promise.all([
            novelRequest("/api/novel/projects"),
            novelRequest("/api/novel/active"),
            novelRequest("/api/novel/jobs")
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
        const activeCreateJob = jobs.find(job =>
            job.job_type === "create" &&
            ["queued", "planning", "pause_requested", "paused", "cancel_requested", "interrupted"].includes(job.status)
        );
        if (activeCreateJob) {
            activeNovelJobId = activeCreateJob.job_id;
            renderNovelJob(activeCreateJob);
            if (!["paused", "interrupted"].includes(activeCreateJob.status)) scheduleNovelPoll();
        }
    } catch (error) {
        novelMessage(`소설 목록 오류: ${error.message}`, "error");
    }
}

function chapterRow(chapter, projectBlocked = false) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `chapter-row ${chapter.completed ? "completed" : "pending"}`;
    const title = document.createElement("span");
    title.textContent = `제 ${chapter.chapter_num}화 · ${chapter.title || "제목 없음"}`;
    const badge = document.createElement("span");
    badge.className = `chapter-badge ${chapter.completed ? "completed" : "pending"}`;
    badge.textContent = chapter.completed
        ? "집필 완료"
        : (chapter.write_status === "needs_review" ? "검토 필요" : (projectBlocked ? "기획 보완 필요" : "대기 중"));
    row.append(title, badge);
    row.addEventListener("click", () => openChapterViewer(chapter.chapter_num));
    return row;
}

async function loadActiveProjectDetails(setActive = true) {
    ensureNovelReplanButton();
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
        currentNovelTitle = config.title || "무제";
        if (novelEl("btn-novel-delete")) novelEl("btn-novel-delete").style.display = "inline-flex";
        novelEl("novel-details-title").textContent = `📖 ${config.title || "제목 없음"}`;
        novelEl("novel-details-genre").textContent = `장르: ${config.genre || "일반"} · 완료 ${config.completed_chapters || 0}/${config.total_chapters || 0}`;
        const list = novelEl("novel-chapters-list");
        const projectBlocked = !config.can_write && !(config.creation_ready && config.planning_status === "project_ready");
        list.replaceChildren(...(config.chapters || []).map(chapter => chapterRow(chapter, projectBlocked)));
        hideAllJobButtons();

        // Legacy Project Check (version < 4)
        const isLegacy = (config.engine_schema_version || 0) < 4;
        const banner = novelEl("legacy-project-banner");
        if (banner) {
            banner.style.display = isLegacy ? "flex" : "none";
        }

        if (isLegacy) {
            novelMessage("레거시 프로젝트 (읽기 전용)", "warning");
            return;
        }

        const { jobs = [] } = await novelRequest("/api/novel/jobs");
        const visibleJobStates = new Set(["queued", "planning", "awaiting_approval", "event_graph_audit", "pilot_writing", "pilot_audit", "writing", "pause_requested", "paused", "cancel_requested", "interrupted"]);
        const job = jobs.find(item => item.project_id === projectId && visibleJobStates.has(item.status));
        if (job) {
            activeNovelJobId = job.job_id;
            renderNovelJob(job);
            scheduleNovelPoll();
        } else if ((config.completed_chapters || 0) < (config.total_chapters || 0)) {
            if (config.can_write) {
                novelEl("btn-novel-write-next").style.display = "inline-flex";
                novelEl("btn-novel-write-all").style.display = "inline-flex";
                novelEl("btn-novel-write-all").textContent = "전체 집필 시작";
                novelMessage("집필 대기 중");
            } else if (config.creation_ready && config.planning_status === "project_ready") {
                novelEl("btn-novel-write-next").style.display = "none";
                novelEl("btn-novel-write-all").style.display = "inline-flex";
                novelEl("btn-novel-write-all").textContent = "기획 확장 시작";
                novelMessage("1차 기획 완료 · 1/5 및 1/3 줄거리 확장을 시작할 수 있습니다.");
            } else {
                novelEl("btn-novel-write-next").style.display = "none";
                novelEl("btn-novel-write-all").style.display = "none";
                novelEl("btn-novel-replan").style.display = "inline-flex";
                novelEl("novel-progress-container").style.display = "block";
                const allErrors = config.planning_errors || [];
                const shownErrors = allErrors.slice(0, 6);
                const remainder = Math.max(0, allErrors.length - shownErrors.length);
                const errorsStr = shownErrors.join("\n· ") + (remainder ? `\n· 외 ${remainder}개` : "");
                novelMessage(`[기획 차단됨] 검증 실패:\n· ${errorsStr}`, "error");
            }
        } else {
            novelMessage("모든 화의 집필이 완료되었습니다.", "success");
        }
    } catch (error) {
        novelMessage(`프로젝트 오류: ${error.message}`, "error");
    }
}

async function startNovelReplan() {
    if (!currentNovelProjectId) return novelMessage("먼저 소설을 선택해 주세요.", "error");
    hideAllJobButtons();
    novelEl("novel-progress-container").style.display = "block";
    novelMessage("기획 보완 작업을 요청하는 중…", "info");
    try {
        const data = await novelRequest("/api/novel/replan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: currentNovelProjectId,
                request_key: `${currentNovelProjectId}-replan-${Date.now()}`
            })
        });
        activeNovelJobId = data.job.job_id;
        renderNovelJob(data.job);
        novelMessage(data.created ? "기획 보완을 시작했습니다." : "이미 진행 중인 작업을 표시합니다.", data.created ? "success" : "warning");
        scheduleNovelPoll(300);
    } catch (error) {
        novelMessage(`기획 보완 시작 실패: ${error.message}`, "error");
        await loadActiveProjectDetails(false);
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
        if (!data.created) {
            novelMessage(
                data.reason === "active_job_exists"
                    ? "집필을 새로 시작하지 않았습니다. 이미 진행 중인 작업 상태를 표시합니다."
                    : "같은 집필 요청이 이미 접수되어 기존 작업을 계속 표시합니다.",
                "warning"
            );
        } else {
            novelMessage("집필 요청 접수 완료 · 백그라운드 작업을 시작했습니다.", "success");
        }
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
        const terminal = ["completed", "completed_with_review", "cancelled", "planning_blocked", "pilot_rejected", "failed", "project_ready"].includes(job.status);
        if (terminal) {
            activeNovelJobId = "";
            clearTimeout(novelPollTimer);
            const projectId = job.result?.project_id || job.project_id || "";
            if (projectId) {
                await novelRequest("/api/novel/set_active", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project_id: projectId })
                });
                await loadNovelProjects();
            }
            if (["planning_blocked", "pilot_rejected", "failed"].includes(job.status)) {
                const errors = job.result?.errors || [];
                const shown = errors.slice(0, 6);
                const remainder = Math.max(0, errors.length - shown.length);
                const detail = shown.length ? `\n· ${shown.join("\n· ")}${remainder ? `\n· 외 ${remainder}개` : ""}` : "";
                novelMessage(`${job.status === "planning_blocked" ? "기획 검증 실패" : "작업 실패"}${detail}`, "error");
            } else if (job.status === "project_ready") {
                novelMessage("새 소설 기획 완료 · 소설 목록에 추가되었습니다.", "success");
            } else if (["completed", "completed_with_review"].includes(job.status)) {
                novelMessage("집필 작업이 완료되었습니다.", "success");
            }
            return;
        }
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
        completed: "완료", completed_with_review: "완료 · 검토 항목 있음",
        event_graph_audit: "사건 기획 검증 중", pilot_writing: "3화 시험 집필 중", pilot_audit: "시험 검토 중",
        planning_blocked: "기획 차단됨", pilot_rejected: "Pilot 검증 실패", project_ready: "1차 기획 완료", failed: "작업 실패"
    };
    const successState = ["project_ready", "completed", "completed_with_review"].includes(job.status);
    novelMessage(
        statusNames[job.status] || job.status,
        (job.status === "interrupted" || job.status === "failed" || job.status === "planning_blocked" || job.status === "pilot_rejected")
            ? "error"
            : (successState ? "success" : "info")
    );
    if (["planning", "writing", "event_graph_audit", "pilot_writing", "pilot_audit"].includes(job.status)) {
        novelEl("btn-novel-pause").style.display = "inline-flex";
        novelEl("btn-novel-cancel").style.display = "inline-flex";
    } else if (job.status === "pause_requested" || job.status === "paused" || job.status === "interrupted") {
        novelEl("btn-novel-resume").textContent = job.status === "pause_requested" ? "계속 진행" : "작업 재개";
        novelEl("btn-novel-resume").style.display = "inline-flex";
        novelEl("btn-novel-cancel").style.display = "inline-flex";
    } else if (job.status === "awaiting_approval") {
        showOutlineApprovalModal();
    } else if (["completed", "completed_with_review", "cancelled", "failed", "planning_blocked", "pilot_rejected", "project_ready"].includes(job.status)) {
        activeNovelJobId = "";
        clearTimeout(novelPollTimer);
        if (job.status === "completed" || job.status === "completed_with_review") {
            setTimeout(async () => {
                try {
                    const config = await novelRequest(`/api/novel/status?project_id=${encodeURIComponent(currentNovelProjectId)}`);
                    let normal = 0, warning = 0, review = 0, quarantine = 0;
                    (config.chapters || []).forEach(ch => {
                        if (ch.completed) {
                            if (ch.write_status === "completed_with_warnings") warning++;
                            else normal++;
                        } else {
                            if (ch.write_status === "needs_review") review++;
                            else if (ch.write_status === "quarantined") quarantine++;
                        }
                    });
                    novelMessage(`전체 집필 완료 요약: 정상 ${normal} | 주의 ${warning} | 검토필요 ${review} | 격리 ${quarantine}`, "success");
                } catch (e) {}
            }, 1000);
        }
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
        if (action === "pause") {
            novelMessage("일시정지 요청 접수 · 현재 안전 단계가 끝나면 멈춥니다. '계속 진행'으로 취소할 수 있습니다.", "warning");
        } else if (action === "resume") {
            novelMessage("작업 재개 요청 접수 완료", "success");
        } else if (action === "cancel") {
            novelMessage("작업 취소 요청을 접수했습니다.", "warning");
        }
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
        if (!data.created) {
            novelMessage(
                data.reason === "active_job_exists"
                    ? "새 소설 기획을 시작하지 않았습니다. 이미 진행 중인 작업을 먼저 재개하거나 취소해 주세요."
                    : "동일한 새 소설 기획 요청이 이미 접수되어 기존 진행 상태를 표시합니다.",
                "warning"
            );
        } else {
            novelMessage(`《${title}》 기획 요청 접수 완료 · 백그라운드 생성 시작`, "success");
        }
        scheduleNovelPoll(300);
    } catch (error) {
        novelMessage(`새 소설 생성 실패: ${error.message}`, "error");
    }
}

async function deleteCurrentNovelProject() {
    const projectId = currentNovelProjectId || novelEl("novel-project-select")?.value || "";
    if (!projectId || !currentNovelTitle) return novelMessage("삭제할 소설을 먼저 선택해 주세요.", "error");
    const confirmed = window.confirm(
        `소설 《${currentNovelTitle}》을 영구 삭제할까요?\n\n설정, 초고, 품질 보고서가 함께 삭제되며 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;
    const button = novelEl("btn-novel-delete");
    if (button) button.disabled = true;
    novelMessage(`《${currentNovelTitle}》 삭제 중…`);
    try {
        const data = await novelRequest("/api/novel/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: projectId, confirm_title: currentNovelTitle })
        });
        const deletedTitle = data.result?.title || currentNovelTitle;
        currentNovelProjectId = "";
        currentNovelTitle = "";
        await loadNovelProjects();
        novelMessage(`《${deletedTitle}》 삭제 완료`, "success");
    } catch (error) {
        novelMessage(`소설 삭제 실패: ${error.message}`, "error");
    } finally {
        if (button) button.disabled = false;
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
