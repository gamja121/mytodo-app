// Novel Writing PWA Client Logic

let currentProjectFilename = "";
let activeJobId = "";
let jobPollingInterval = null;

// Load all project files
async function loadNovelProjects() {
    try {
        const select = document.getElementById('novel-project-select');
        select.innerHTML = '<option value="">소설 목록을 불러오는 중...</option>';

        const res = await fetch(apiUrl('/api/novel/projects'), {
            headers: authHeaders()
        });
        if (res.status !== 200) throw new Error("Projects fetch failed");
        
        const projects = await res.json();
        select.innerHTML = '';
        
        if (projects.length === 0) {
            select.innerHTML = '<option value="">기획된 작품 없음</option>';
            showNoProjectDetails();
            return;
        }

        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.filename;
            opt.innerText = `${p.title} (${p.genre})`;
            select.appendChild(opt);
        });

        // Fetch active pointer
        const activeRes = await fetch(apiUrl('/api/novel/active'), { headers: authHeaders() });
        if (activeRes.status === 200) {
            const activeData = await activeRes.json();
            if (activeData.active) {
                select.value = activeData.active;
            }
        }
        
        loadActiveProjectDetails();
    } catch (e) {
        console.error("Failed to load novel projects", e);
    }
}

function showNoProjectDetails() {
    document.getElementById('novel-details-title').innerText = "📖 기획된 소설이 없습니다";
    document.getElementById('novel-details-genre').innerText = "새 소설 기획을 클릭하여 시작하세요.";
    document.getElementById('novel-chapters-list').innerHTML = "";
    hideAllJobButtons();
}

function hideAllJobButtons() {
    document.getElementById('btn-novel-write-next').style.display = 'none';
    document.getElementById('btn-novel-write-all').style.display = 'none';
    document.getElementById('btn-novel-pause').style.display = 'none';
    document.getElementById('btn-novel-resume').style.display = 'none';
    document.getElementById('btn-novel-cancel').style.display = 'none';
}

// Load details of selected project
async function loadActiveProjectDetails() {
    const select = document.getElementById('novel-project-select');
    const filename = select.value;
    currentProjectFilename = filename;
    
    if (!filename) {
        showNoProjectDetails();
        return;
    }

    try {
        // Set active project pointer
        await fetch(apiUrl('/api/novel/set_active'), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ filename: filename })
        });

        const res = await fetch(apiUrl(`/api/novel/status?filename=${encodeURIComponent(filename)}`), {
            headers: authHeaders()
        });
        if (res.status !== 200) throw new Error("Status fetch failed");

        const config = await res.json();
        document.getElementById('novel-details-title').innerText = `📖 ${config.title || "제목 없음"}`;
        document.getElementById('novel-details-genre').innerText = `장르: ${config.genre || "일반"} | 목표 분량: ${config.total_chapters || 0}부작`;

        // Render chapters list
        const chaptersList = document.getElementById('novel-chapters-list');
        chaptersList.innerHTML = '';
        
        const chapters = config.chapters || [];
        let allCompleted = true;
        
        chapters.forEach(ch => {
            const row = document.createElement('div');
            const isCompleted = ch.completed;
            if (!isCompleted) allCompleted = false;
            
            row.className = `chapter-row ${isCompleted ? 'completed' : 'pending'}`;
            row.innerHTML = `
                <span>제 ${ch.chapter_num}화 - ${ch.title}</span>
                <span class="chapter-badge ${isCompleted ? 'completed' : 'pending'}">${isCompleted ? '집필 완료' : '대기 중'}</span>
            `;
            chaptersList.appendChild(row);
        });

        // Sync buttons visibility
        hideAllJobButtons();
        
        // Scan for active jobs on this project
        const jobsRes = await fetch(apiUrl('/api/novel/active_jobs'), { headers: authHeaders() });
        const activeJobs = await jobsRes.json();
        const projectJob = activeJobs.find(j => j.filename === filename);

        if (projectJob) {
            activeJobId = projectJob.job_id;
            startPollingJob(projectJob.job_id);
        } else {
            if (allCompleted) {
                document.getElementById('novel-chapters-list').innerHTML += `<div style="text-align:center; padding:15px; color:#10B981; font-weight:700;">🎉 모든 화의 집필이 완료되었습니다!</div>`;
            } else {
                document.getElementById('btn-novel-write-next').style.display = 'inline-block';
                document.getElementById('btn-novel-write-all').style.display = 'inline-block';
            }
        }
    } catch (e) {
        console.error("Failed to load project status", e);
    }
}

// Start a background writing job
async function startWritingJob(jobType) {
    if (!currentProjectFilename) return;
    
    hideAllJobButtons();
    document.getElementById('novel-progress-container').style.display = 'block';
    document.getElementById('novel-status-text').innerText = "집필 대기 중...";
    document.getElementById('novel-progress-bar').style.width = '0%';
    document.getElementById('novel-progress-text').innerText = '0%';
    document.getElementById('novel-logs-box').innerHTML = '[시스템] 집필 프로세스를 호출하는 중...';

    try {
        const res = await fetch(apiUrl('/api/novel/write'), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                filename: currentProjectFilename,
                job_type: jobType,
                auto_approve: false
            })
        });

        if (res.status === 200) {
            const data = await res.json();
            activeJobId = data.job_id;
            startPollingJob(data.job_id);
        } else {
            const err = await res.text();
            alert("집필 시작 실패: " + err);
            loadActiveProjectDetails();
        }
    } catch (e) {
        alert("네트워크 에러로 집필을 시작할 수 없습니다: " + e);
        loadActiveProjectDetails();
    }
}

// Polling Job Status
function startPollingJob(jobId) {
    if (jobPollingInterval) clearInterval(jobPollingInterval);
    document.getElementById('novel-progress-container').style.display = 'block';

    jobPollingInterval = setInterval(async () => {
        try {
            const res = await fetch(apiUrl(`/api/novel/job?job_id=${encodeURIComponent(jobId)}`), {
                headers: authHeaders()
            });
            if (res.status !== 200) return;
            
            const job = await res.json();
            if (!job || !job.status) return;

            // Render logs
            const logsBox = document.getElementById('novel-logs-box');
            logsBox.innerHTML = (job.logs || []).join('\n');
            logsBox.scrollTop = logsBox.scrollHeight;

            // Update progress
            document.getElementById('novel-progress-bar').style.width = `${job.progress}%`;
            document.getElementById('novel-progress-text').innerText = `${job.progress}%`;

            // State management
            if (job.status === 'planning') {
                document.getElementById('novel-status-text').innerText = "기획 수립 단계...";
                hideAllJobButtons();
                document.getElementById('btn-novel-cancel').style.display = 'inline-block';
            } else if (job.status === 'writing') {
                document.getElementById('novel-status-text').innerText = `제 ${job.current_chapter || "?"}화 집필 및 감사 중...`;
                hideAllJobButtons();
                document.getElementById('btn-novel-pause').style.display = 'inline-block';
                document.getElementById('btn-novel-cancel').style.display = 'inline-block';
            } else if (job.status === 'awaiting_approval') {
                clearInterval(jobPollingInterval);
                document.getElementById('novel-status-text').innerText = "상세 줄거리 검토 승인 대기 중";
                hideAllJobButtons();
                
                // Show Approval Modal
                showOutlineApprovalModal();
            } else if (job.status === 'paused') {
                document.getElementById('novel-status-text').innerText = "작업 일시 중지됨";
                hideAllJobButtons();
                document.getElementById('btn-novel-resume').style.display = 'inline-block';
                document.getElementById('btn-novel-cancel').style.display = 'inline-block';
            } else if (job.status === 'completed') {
                clearInterval(jobPollingInterval);
                document.getElementById('novel-status-text').innerText = "완료됨";
                alert("🎉 집필 완료! 원고가 추가되었습니다.");
                loadActiveProjectDetails();
            } else if (job.status === 'failed') {
                clearInterval(jobPollingInterval);
                document.getElementById('novel-status-text').innerText = `실패: ${job.error || "알 수 없는 오류"}`;
                alert("❌ 집필 실패: " + (job.error || "알 수 없는 요인"));
                loadActiveProjectDetails();
            } else if (job.status === 'cancelled') {
                clearInterval(jobPollingInterval);
                document.getElementById('novel-status-text').innerText = "취소됨";
                alert("집필 작업이 취소되었습니다.");
                loadActiveProjectDetails();
            } else if (job.status === 'interrupted') {
                clearInterval(jobPollingInterval);
                document.getElementById('novel-status-text').innerText = `중단됨: ${job.error || ""}`;
                alert("⚠️ 집필이 중단되었습니다 (외부 요인/LLM 오프라인).");
                loadActiveProjectDetails();
            }
        } catch (e) {
            console.error("Polling job status error", e);
        }
    }, 2000);
}

// Control active job (pause, resume, cancel)
async function controlActiveJob(action) {
    if (!activeJobId) return;

    try {
        const res = await fetch(apiUrl(`/api/novel/${action}`), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ job_id: activeJobId })
        });
        if (res.ok) {
            if (action === 'cancel' || action === 'pause') {
                if (jobPollingInterval) clearInterval(jobPollingInterval);
            }
            if (action === 'resume') {
                startPollingJob(activeJobId);
            } else {
                loadActiveProjectDetails();
            }
        } else {
            alert("작업 제어 실패: " + res.status);
        }
    } catch (e) {
        alert("네트워크 오류: " + e);
    }
}

// Show Outline Approval Modal
async function showOutlineApprovalModal() {
    try {
        const res = await fetch(apiUrl(`/api/novel/status?filename=${encodeURIComponent(currentProjectFilename)}`), {
            headers: authHeaders()
        });
        const config = await res.json();
        
        const outlineText = config.outline_3rd ? config.outline_3rd.outline_text || config.outline_3rd : "줄거리를 가져오지 못했습니다.";
        document.getElementById('outline-approval-text').innerText = outlineText;
        document.getElementById('outline-approval-modal').style.display = 'flex';
    } catch (e) {
        console.error("Failed to load outline for approval modal", e);
    }
}

// Respond to Outline (Approve / Reject)
async function respondToOutline(action) {
    if (!activeJobId) return;
    
    document.getElementById('outline-approval-modal').style.display = 'none';
    
    try {
        const res = await fetch(apiUrl('/api/novel/approve'), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                job_id: activeJobId,
                action: action
            })
        });

        if (res.ok) {
            if (action === 'approve') {
                startPollingJob(activeJobId);
            } else {
                alert("기획안이 반려 및 폐기되었습니다.");
                loadActiveProjectDetails();
            }
        } else {
            alert("승인 전송 실패: " + res.status);
            loadActiveProjectDetails();
        }
    } catch (e) {
        alert("네트워크 오류: " + e);
        loadActiveProjectDetails();
    }
}

// New Project Modal triggers
function openNewProjectModal() {
    document.getElementById('new-project-title').value = '';
    document.getElementById('new-project-genre').value = '';
    document.getElementById('new-project-prompt').value = '';
    document.getElementById('new-project-modal').style.display = 'flex';
}

function closeNewProjectModal() {
    document.getElementById('new-project-modal').style.display = 'none';
}

// Submit a new project creation request
async function submitNewProject() {
    const title = document.getElementById('new-project-title').value.trim();
    const genre = document.getElementById('new-project-genre').value.trim();
    const promptText = document.getElementById('new-project-prompt').value.trim();

    if (!title || !genre || !promptText) {
        alert("모든 필드를 작성해 주세요.");
        return;
    }

    closeNewProjectModal();
    
    // Show a loading overlay during long-running LLM initial planning
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '1';
    loadingOverlay.innerHTML = `
        <div class="spinner"></div>
        <div style="font-weight: 600; letter-spacing: 1px; text-align:center; margin-top:15px;">
            소설 기획 및 세계관 수립 중... 🤖<br>
            <span style="font-size:0.8em; font-weight:400; color:var(--text-muted);">(약 30~45초 소요)</span>
        </div>
    `;

    try {
        const res = await fetch(apiUrl('/api/novel/create'), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                title: title,
                genre: genre,
                user_prompt: promptText
            })
        });

        if (res.status === 200) {
            const data = await res.json();
            alert("🎉 새 소설 기획서와 시놉시스가 성공적으로 생성되었습니다!");
            // Restore loading overlay styling
            loadingOverlay.innerHTML = `
                <div class="spinner"></div>
                <div style="font-weight: 600; letter-spacing: 1px;">Antigravity 🚀</div>
            `;
            loadingOverlay.style.opacity = '0';
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
            
            // Reload projects
            loadNovelProjects();
        } else {
            const err = await res.text();
            alert("소설 기획 생성 실패: " + err);
            window.location.reload();
        }
    } catch (e) {
        alert("소설 기획 중 오류가 발생했습니다: " + e);
        window.location.reload();
    }
}
