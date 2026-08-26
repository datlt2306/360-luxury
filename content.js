(function () {
    const TABLE_ID = "checkInTable";
    const STORAGE_KEY = "columnToggleState_v1";
    const HEADER_STORAGE_KEY = "headerSectionVisible_v1";
    const SIDEBAR_STORAGE_KEY = "sidebarVisible_v1";
    const SELECTED_SV_STORAGE_KEY = "selectedStudentIndex_v1";

    function loadState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function applyStateToAllRows(table, state) {
        const rows = table.rows;
        Object.keys(state).forEach(idx => {
            const colIndex = parseInt(idx, 10);
            const isVisible = state[idx];
            for (let r = 0; r < rows.length; r++) {
                const cell = rows[r].cells[colIndex];
                if (cell) cell.style.display = isVisible ? "" : "none";
            }
        });
    }

    function toggleColumn(table, idx) {
        const rows = table.rows;
        if (!rows[0] || !rows[0].cells[idx]) return true;

        const isCurrentlyHidden = rows[0].cells[idx].style.display === "none";
        const shouldBeVisible = isCurrentlyHidden;

        for (let r = 0; r < rows.length; r++) {
            const cell = rows[r].cells[idx];
            if (cell) cell.style.display = shouldBeVisible ? "" : "none";
        }

        return shouldBeVisible;
    }

    function showAllColumns(table, state, buttons) {
        const rows = table.rows;
        const colCount = rows[0] ? rows[0].cells.length : 0;

        for (let i = 0; i < colCount; i++) {
            state[i] = true;
            for (let r = 0; r < rows.length; r++) {
                const cell = rows[r].cells[i];
                if (cell) cell.style.display = "";
            }
        }

        // Cập nhật class của tất cả buttons
        buttons.forEach(btn => btn.classList.remove("hidden"));

        saveState(state);
    }

    function injectButtons(table, state) {
        // Xóa container cũ nếu có
        const oldContainer = document.getElementById("column-toggle-container");
        if (oldContainer) oldContainer.remove();

        const headerCells = table.querySelectorAll("thead th");

        const container = document.createElement("div");
        container.id = "column-toggle-container";

        // Nút "Hiển thị tất cả"
        const showAllBtn = document.createElement("button");
        showAllBtn.textContent = "↻ Hiện tất cả";
        showAllBtn.className = "column-btn show-all-btn";
        showAllBtn.style.background = "#4CAF50";
        showAllBtn.style.color = "white";
        showAllBtn.style.fontWeight = "bold";
        container.appendChild(showAllBtn);

        const columnButtons = [];

        headerCells.forEach((th, i) => {
            const btn = document.createElement("button");
            btn.textContent = th.innerText || `Cột ${i + 1}`;
            btn.className = "column-btn";

            // Mặc định tất cả cột đều hiện (true)
            if (state[i] === undefined) state[i] = true;

            if (state[i] === false) btn.classList.add("hidden");

            btn.onclick = () => {
                const visible = toggleColumn(table, i);
                state[i] = visible;
                saveState(state);

                if (!visible) btn.classList.add("hidden");
                else btn.classList.remove("hidden");
            };

            columnButtons.push(btn);
            container.appendChild(btn);
        });

        // Gắn sự kiện cho nút "Hiện tất cả"
        showAllBtn.onclick = () => {
            showAllColumns(table, state, columnButtons);
        };

        table.parentNode.insertBefore(container, table);
    }

    function injectHeaderToggle() {
        const headerSection = document.querySelector("section.content-header-big");
        if (!headerSection) return;

        const boxBody = document.querySelector("div.box-body");
        const contentWrapper = document.querySelector("div.content-wrapper");

        // Xóa nút cũ nếu có
        const oldBtn = document.getElementById("header-toggle-btn");
        if (oldBtn) oldBtn.remove();

        // Load trạng thái từ localStorage
        const isVisible = localStorage.getItem(HEADER_STORAGE_KEY) !== "false";

        // Áp dụng trạng thái
        headerSection.style.display = isVisible ? "" : "none";
        if (boxBody) {
            boxBody.style.paddingTop = isVisible ? "60px" : "5px";
        }
        if (contentWrapper) {
            contentWrapper.style.paddingTop = isVisible ? "50px" : "0px";
        }

        // Tạo nút toggle
        const btn = document.createElement("button");
        btn.id = "header-toggle-btn";
        btn.textContent = isVisible ? "👁 Ẩn Header" : "👁 Hiện Header";
        btn.className = "column-btn header-toggle-btn";
        btn.style.background = isVisible ? "#2196F3" : "#e57373";
        btn.style.color = "white";
        btn.style.fontWeight = "bold";
        btn.style.marginLeft = "10px";

        btn.onclick = () => {
            const currentlyVisible = headerSection.style.display !== "none";
            const newVisible = !currentlyVisible;

            headerSection.style.display = newVisible ? "" : "none";
            localStorage.setItem(HEADER_STORAGE_KEY, newVisible);

            // Điều chỉnh padding-top của box-body
            if (boxBody) {
                boxBody.style.paddingTop = newVisible ? "60px" : "5px";
            }

            // Điều chỉnh padding-top của content-wrapper
            if (contentWrapper) {
                contentWrapper.style.paddingTop = newVisible ? "50px" : "0px";
            }

            btn.textContent = newVisible ? "👁 Ẩn Header" : "👁 Hiện Header";
            btn.style.background = newVisible ? "#2196F3" : "#e57373";
        };

        // Thêm vào container của column toggles
        const container = document.getElementById("column-toggle-container");
        if (container) {
            container.appendChild(btn);
        } else {
            // Nếu chưa có container, thêm trước header section
            headerSection.parentNode.insertBefore(btn, headerSection);
        }
    }

    function injectSidebarToggle() {
        const sidebar = document.querySelector("aside.main-sidebar");
        if (!sidebar) return;

        const contentWrapper = document.querySelector("div.content-wrapper");
        const mainHeader = document.querySelector("header.main-header");
        const wrapper = document.querySelector("div.wrapper");

        // Xóa nút cũ nếu có
        const oldBtn = document.getElementById("sidebar-toggle-btn");
        if (oldBtn) oldBtn.remove();

        // Load trạng thái từ localStorage
        const isVisible = localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";

        // Áp dụng trạng thái
        sidebar.style.display = isVisible ? "" : "none";
        sidebar.style.background = isVisible ? "#222d32" : "white";
        if (contentWrapper) {
            contentWrapper.style.marginLeft = isVisible ? "" : "5px";
        }
        if (mainHeader) {
            mainHeader.style.display = isVisible ? "" : "none";
        }
        if (wrapper) {
            wrapper.style.background = isVisible ? "#222d32" : "white";
        }

        // Tạo nút toggle
        const btn = document.createElement("button");
        btn.id = "sidebar-toggle-btn";
        btn.textContent = isVisible ? "◀ Ẩn Sidebar" : "▶ Hiện Sidebar";
        btn.className = "column-btn sidebar-toggle-btn";
        btn.style.background = isVisible ? "#9C27B0" : "#e57373";
        btn.style.color = "white";
        btn.style.fontWeight = "bold";
        btn.style.marginLeft = "10px";

        btn.onclick = () => {
            const currentlyVisible = sidebar.style.display !== "none";
            const newVisible = !currentlyVisible;

            sidebar.style.display = newVisible ? "" : "none";
            sidebar.style.background = newVisible ? "#222d32" : "white";
            localStorage.setItem(SIDEBAR_STORAGE_KEY, newVisible);

            // Điều chỉnh margin-left của content-wrapper
            if (contentWrapper) {
                contentWrapper.style.marginLeft = newVisible ? "" : "5px";
            }

            // Ẩn/hiện main-header
            if (mainHeader) {
                mainHeader.style.display = newVisible ? "" : "none";
            }

            // Đổi màu nền wrapper
            if (wrapper) {
                wrapper.style.background = newVisible ? "#222d32" : "white";
            }

            btn.textContent = newVisible ? "◀ Ẩn Sidebar" : "▶ Hiện Sidebar";
            btn.style.background = newVisible ? "#9C27B0" : "#e57373";
        };

        // Thêm vào container của column toggles
        const container = document.getElementById("column-toggle-container");
        if (container) {
            container.appendChild(btn);
        }
    }

    function createQuickNavPanel(table) {
        // Xóa panel cũ nếu có
        const oldPanel = document.getElementById("quick-nav-panel");
        if (oldPanel) oldPanel.remove();

        // Lấy danh sách họ tên từ bảng (cột thứ 4 - index 3)
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const rows = tbody.querySelectorAll("tr");
        if (rows.length === 0) return;

        // Tạo panel
        const panel = document.createElement("div");
        panel.id = "quick-nav-panel";
        panel.innerHTML = `
            <div id="quick-nav-header">
                <span>📋 Danh sách SV</span>
                <button id="quick-nav-close">✕</button>
            </div>
            <div id="quick-nav-list"></div>
        `;

        // Style cho panel
        Object.assign(panel.style, {
            position: "fixed",
            top: "100px",
            right: "20px",
            width: "200px",
            maxHeight: "550px",
            background: "white",
            border: "2px solid #2196F3",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: "999999",
            overflow: "hidden",
            fontFamily: "Arial, sans-serif"
        });

        document.body.appendChild(panel);

        // Style cho header (draggable)
        const header = panel.querySelector("#quick-nav-header");
        Object.assign(header.style, {
            background: "#2196F3",
            color: "white",
            padding: "8px 10px",
            cursor: "move",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "13px"
        });

        // Nút đóng
        const closeBtn = panel.querySelector("#quick-nav-close");
        Object.assign(closeBtn.style, {
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "16px",
            cursor: "pointer"
        });
        closeBtn.onclick = () => panel.style.display = "none";

        // Danh sách
        const listContainer = panel.querySelector("#quick-nav-list");
        Object.assign(listContainer.style, {
            maxHeight: "500px",
            overflowY: "auto",
            padding: "5px"
        });

        // Lấy index các cột quan trọng
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.innerText.trim());
        const nameIdx = headers.findIndex(h => h.includes("Họ tên"));
        const afccIdx = headers.findIndex(h => h.includes("AF/CC"));
        const checkInIdx = headers.findIndex(h => h.includes("Điểm danh?"));
        const scoreIdx = headers.findIndex(h => h.includes("Nộp bài?"));

        // Thêm từng sinh viên vào danh sách
        rows.forEach((row, index) => {
            const cells = row.cells;
            if (!cells || nameIdx === -1) return;

            const sttCell = cells[0];
            const nameCell = cells[nameIdx];
            const afccCell = afccIdx !== -1 ? cells[afccIdx] : null;
            const scoreCell = scoreIdx !== -1 ? cells[scoreIdx] : null;

            const name = nameCell?.innerText?.trim() || `SV ${index + 1}`;
            const stt = sttCell?.innerText?.trim() || (index + 1);

            // Kiểm tra trạng thái
            let score = "";
            let hasSigned = false;
            let isApproved = false;
            let isScored = false;

            if (scoreCell) {
                const html = scoreCell.innerHTML;
                const text = scoreCell.innerText;
                
                // Tìm điểm số từ scoreWrap_{id} hoặc tương tự
                const scoreElem = scoreCell.querySelector('[id^="scoreWrap_"]');
                if (scoreElem && scoreElem.innerText.trim()) {
                    const tempScore = scoreElem.innerText.trim();
                    score = tempScore;
                    if (tempScore && tempScore.toUpperCase() !== "N/A") {
                        isScored = true;
                    }
                } else {
                    const scoreMatch = text.match(/PRO[:\s]*(\d+\.?\d*)/i) || text.match(/ASM[:\s]*(\d+\.?\d*)/i);
                    if (scoreMatch) {
                        score = scoreMatch[1];
                        isScored = true;
                    }
                }

                if (text.includes("Đã ký")) hasSigned = true;
                if (html.includes("CTHĐ duyệt") || text.includes("CTHĐ duyệt")) isApproved = true;
            }

            const item = document.createElement("div");
            item.className = "quick-nav-item";

            const checkInCell = checkInIdx !== -1 ? cells[checkInIdx] : null;
            let checkInStatus = "NONE";
            if (checkInCell) {
                const checkedRadio = checkInCell.querySelector('input[type="radio"]:checked');
                if (checkedRadio) {
                    const onclickAttr = checkedRadio.getAttribute('onclick') || '';
                    if (onclickAttr.includes('PRESENT')) {
                        checkInStatus = 'PRESENT';
                    } else if (onclickAttr.includes('ABSENT')) {
                        checkInStatus = 'ABSENT';
                    } else if (onclickAttr.includes('LATE')) {
                        checkInStatus = 'LATE';
                    }
                }
            }

            let nameColor = "#d32f2f"; // Mặc định màu đỏ cho chưa chọn hoặc vắng
            let statusSuffix = "";

            if (checkInStatus === "PRESENT" || checkInStatus === "LATE") {
                nameColor = "#2e7d32"; // Màu xanh cho có mặt
                statusSuffix = " (P)";
            } else if (checkInStatus === "ABSENT") {
                nameColor = "#d32f2f"; // Màu đỏ cho vắng mặt
                statusSuffix = " (A)";
            }

            // Hiển thị tên và điểm
            const sttSpan = `<span style="color:${nameColor}; font-weight: 500;">${stt}. ${name}${statusSuffix}</span>`;
            const scoreSpan = (score && score.toUpperCase() !== "N/A") ? `<span style="color:#1565c0;font-weight:bold;margin-left:auto; background: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${score}</span>` : "";
            
            item.innerHTML = sttSpan + scoreSpan;
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.justifyContent = "space-between";
            Object.assign(item.style, {
                padding: "6px 8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                fontSize: "12px",
                transition: "background 0.2s",
                background: hasSigned ? "#e0e0e0" : ""
            });

            item.onmouseenter = () => item.style.background = "#e3f2fd";
            item.onmouseleave = () => item.style.background = hasSigned ? "#e0e0e0" : "";

            item.onclick = () => {
                // Copy họ tên sinh viên vào clipboard
                navigator.clipboard.writeText(name).then(() => {
                    // Hiển thị thông báo nhỏ
                    const toast = document.createElement("div");
                    toast.textContent = `📋 Đã copy: ${name}`;
                    Object.assign(toast.style, {
                        position: "fixed",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#323232",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "4px",
                        zIndex: "9999999",
                        fontSize: "13px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                    });
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 1500);
                }).catch(err => console.error("Copy failed:", err));

                // Xóa highlight cũ (chỉ khi chọn người khác)
                document.querySelectorAll(".highlight-row").forEach(el => {
                    el.classList.remove("highlight-row");
                    el.style.backgroundColor = "";
                    el.style.border = "";
                });

                // Cuộn đến dòng
                row.scrollIntoView({ behavior: "smooth", block: "center" });

                // Highlight dòng - giữ lại cho đến khi chọn người khác
                row.classList.add("highlight-row");
                row.style.backgroundColor = "#c8e6c9"; // light green
                row.style.border = "3px solid #d32f2f"; // red border

                // Lưu vị trí sinh viên đang chọn
                localStorage.setItem(SELECTED_SV_STORAGE_KEY, index.toString());

                // Highlight item đang chọn trong panel
                listContainer.querySelectorAll(".quick-nav-item").forEach(el => {
                    el.classList.remove("selected-sv");
                    el.style.fontWeight = "";
                });
                item.classList.add("selected-sv");
                item.style.fontWeight = "bold";
            };

            listContainer.appendChild(item);
        });

        // Draggable functionality
        let isDragging = false;
        let offsetX, offsetY;

        header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            header.style.cursor = "grabbing";
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
        };

        document.onmouseup = () => {
            isDragging = false;
            header.style.cursor = "move";
        };

        // Thêm nút mở lại panel vào container
        const container = document.getElementById("column-toggle-container");
        if (container) {
            const showPanelBtn = document.createElement("button");
            showPanelBtn.id = "show-nav-panel-btn";
            showPanelBtn.textContent = "📋 DS Sinh viên";
            showPanelBtn.className = "column-btn";
            showPanelBtn.style.background = "#2196F3";
            showPanelBtn.style.color = "white";
            showPanelBtn.style.fontWeight = "bold";
            showPanelBtn.style.marginLeft = "10px";

            showPanelBtn.onclick = () => {
                panel.style.display = panel.style.display === "none" ? "" : "none";
            };

            // Xóa nút cũ nếu có
            const oldBtn = document.getElementById("show-nav-panel-btn");
            if (oldBtn) oldBtn.remove();

            container.appendChild(showPanelBtn);
        }

        // Khôi phục sinh viên đã chọn từ localStorage
        const savedIndex = localStorage.getItem(SELECTED_SV_STORAGE_KEY);
        if (savedIndex !== null) {
            const idx = parseInt(savedIndex, 10);
            const items = listContainer.querySelectorAll(".quick-nav-item");
            if (items[idx]) {
                items[idx].classList.add("selected-sv");
                items[idx].style.fontWeight = "bold";
                // Cuộn panel đến item đã chọn
                items[idx].scrollIntoView({ behavior: "auto", block: "center" });
                // Cuộn bảng đến dòng đã chọn
                const tableRows = tbody.querySelectorAll("tr");
                if (tableRows[idx]) {
                    setTimeout(() => {
                        tableRows[idx].scrollIntoView({ behavior: "smooth", block: "center" });
                        tableRows[idx].classList.add("highlight-row");
                        tableRows[idx].style.backgroundColor = "#c8e6c9";
                        tableRows[idx].style.border = "3px solid #d32f2f";
                    }, 600);
                }
            }
        }
    }

    // Xóa <br> thừa ở đầu cột Điểm danh (cột index 7)
    function removeLeadingBrFromCheckInColumn(table) {
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            const checkInCell = row.cells[7]; // Cột "Điểm danh?"
            if (checkInCell) {
                // Xóa các <br> ở đầu cell
                while (checkInCell.firstChild && checkInCell.firstChild.nodeName === "BR") {
                    checkInCell.removeChild(checkInCell.firstChild);
                }
            }
        });
    }

    // Xử lý màu sắc cho bảng lịch bảo vệ (#scheduleTable)
    function processScheduleTable() {
        const table = document.getElementById("scheduleTable");
        if (!table) return;

        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const rows = tbody.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.cells;
            if (cells.length < 5) return;

            let btn = row.querySelector("a.btn, button.btn");
            if (!btn) return;

            const btnText = btn.innerText.trim().toLowerCase();
            const isClosed = cells[1].innerText.toLowerCase().includes("closed");

            let bgColor = "";
            let textColor = "white";

            if (isClosed) {
                bgColor = "#94a3b8"; // Xám (Đã đóng)
            } else {
                // Lấy thông tin thời gian từ cột "Ghi chú" (index 9)
                const ghiChuCell = cells[9];
                const timeRangeText = ghiChuCell ? ghiChuCell.innerText.trim() : "";
                const timeMatch = timeRangeText.match(/(\d{1,2})[h:](\d{2})/);

                if (timeMatch) {
                    const startHour = parseInt(timeMatch[1], 10);
                    const startMinute = parseInt(timeMatch[2], 10);
                    const startTotalMinutes = startHour * 60 + startMinute;

                    const isAccepted = btnText.includes("vào ca bảo vệ");

                    if (currentTotalMinutes < startTotalMinutes) {
                        // TƯƠNG LAI -> Luôn màu Da cam theo yêu cầu
                        bgColor = "#f59e0b"; 
                    } else {
                        // HIỆN TẠI HOẶC QUÁ KHỨ
                        if (isAccepted) {
                            bgColor = "#10b981"; // Xanh Green (Đang diễn ra)
                        } else {
                            bgColor = "#ef4444"; // Đỏ (Trễ giờ chưa nhận)
                        }
                    }
                } else {
                    // Mặc định nếu không có giờ
                    bgColor = btnText.includes("vào ca bảo vệ") ? "#10b981" : "#f59e0b";
                }
            }

            if (bgColor) {
                btn.style.setProperty("background-color", bgColor, "important");
                btn.style.setProperty("border-color", bgColor, "important");
                btn.style.setProperty("color", textColor, "important");
                btn.style.setProperty("font-weight", "600", "important");
                btn.style.setProperty("transition", "all 0.2s", "important");
            }
        });
    }

    function init() {
        // Đợi 500ms để đảm bảo JS của website đã chạy xong
        setTimeout(() => {
            const table = document.getElementById(TABLE_ID);
            const scheduleTable = document.getElementById("scheduleTable");

            // Xử lý bảng lịch bảo vệ (độc lập với bảng điểm)
            if (scheduleTable) {
                processScheduleTable();
                
                // Theo dõi thay đổi trong scheduleTable
                const scheduleTbody = scheduleTable.querySelector("tbody");
                if (scheduleTbody) {
                    const scheduleObserver = new MutationObserver(() => {
                        processScheduleTable();
                    });
                    scheduleObserver.observe(scheduleTbody, { childList: true, subtree: true });
                }
            }

            // Nếu không có bảng điểm thì dừng phần xử lý bảng điểm
            if (!table) return;

            const state = loadState();

            // Inject buttons
            injectButtons(table, state);

            // Áp dụng trạng thái đã lưu cho tất cả rows hiện có
            applyStateToAllRows(table, state);

            // Inject header toggle button
            injectHeaderToggle();

            // Inject sidebar toggle button
            injectSidebarToggle();

            // Tạo panel điều hướng nhanh
            createQuickNavPanel(table);

            // Xóa <br> thừa ở đầu cột Điểm danh (cột index 7)
            removeLeadingBrFromCheckInColumn(table);

            // Theo dõi thay đổi trong tbody để áp dụng lại state và refresh panel khi có rows mới
            const tbody = table.querySelector("tbody");
            if (tbody) {
                let debounceTimer = null;
                const observer = new MutationObserver(() => {
                    // Debounce để tránh gọi quá nhiều lần
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        applyStateToAllRows(table, loadState());
                        createQuickNavPanel(table); // Refresh panel
                        processScheduleTable(); // Refresh schedule colors
                    }, 300);
                });

                observer.observe(tbody, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }

            console.log("[E360-VUI] Extension loaded. State:", state);
        }, 500);
    }

    // ==================== SCORE INPUT PANEL ====================

    function isInputScorePage() {
        const href = window.location.href;
        return href.includes("/Proctor/InputScore") || 
               href.includes("/CommitteeMember/InputScore") ||
               href.includes("/CommitteeMember/InputScoreDetail");
    }

    function createScoreInputPanel() {
        const scoreTable = document.getElementById("tblScore");
        if (!scoreTable) return;

        // Xóa panel cũ nếu có
        const oldPanel = document.getElementById("score-input-panel");
        if (oldPanel) oldPanel.remove();

        // Lấy danh sách tiêu chí từ bảng
        const rows = scoreTable.querySelectorAll("tbody tr:not([style*='background'])");
        if (rows.length === 0) return;

        // Tìm các lệch điểm IAP
        const iapDiscrepancies = [];
        const alerts = document.querySelectorAll(".alert-danger");
        alerts.forEach(alert => {
            const text = alert.innerText;
            const match = text.match(/Điểm phần (.*?) đang lệch.*?so với điểm IAP ([\d.]+)/);
            if (match) {
                iapDiscrepancies.push({
                    sectionName: match[1].trim(),
                    score: parseFloat(match[2])
                });
            }
        });

        const criteria = [];
        rows.forEach(row => {
            const scoreInput = row.querySelector("input.score-input");
            if (!scoreInput) return;

            criteria.push({
                name: row.cells[2]?.innerText?.trim() || "Tiêu chí",
                weight: parseFloat(scoreInput.dataset.weight) || 0,
                inputElement: scoreInput,
                itemId: scoreInput.dataset.itemid,
                criteriaType: scoreInput.dataset.criteriatype
            });
        });

        if (criteria.length === 0) return;

        const hasDATNSections = criteria.some(c => c.criteriaType === "NHOM" || c.criteriaType === "CANHAN" || c.criteriaType === "TAILIEUDUAN");

        // Tạo panel
        const panel = document.createElement("div");
        panel.id = "score-input-panel";
        panel.className = "premium-panel";
        panel.innerHTML = `
            <div id="score-panel-header" class="panel-header">
                <span>🎯 Nhập điểm nâng cao</span>
                <div id="score-panel-actions">
                    <button id="score-panel-minimize" class="panel-btn" title="Thu nhỏ">_</button>
                    <button id="score-panel-close" class="panel-btn">✕</button>
                </div>
            </div>
            <div id="score-panel-content" class="panel-content">
                ${iapDiscrepancies.length > 0 ? `
                    <div id="iap-quick-fixes" class="iap-container">
                        <div class="iap-title">🛠 Khớp điểm IAP (Tài liệu):</div>
                        ${iapDiscrepancies.map((fix, idx) => `
                            <div class="iap-fix-row" style="display: flex; gap: 5px; margin-top: 5px;">
                                <input type="number" class="iap-custom-score" value="${fix.score}" step="0.1" min="0" max="10" 
                                       style="width: 50px; padding: 4px; border-radius: 4px; border: 1px solid #10b981; font-weight: bold;">
                                <button class="iap-fix-btn" data-section="${fix.sectionName}" style="flex: 1; margin-top: 0; padding: 6px;">
                                    ✅ Đặt <b>${fix.sectionName}</b>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${hasDATNSections ? `
                <div class="section-fill-container" style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px;">
                    <div class="iap-title" style="color: #1e40af;">🚀 Nhập nhanh các phần khác:</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <input type="number" id="section-fill-score" value="8" step="0.1" min="0" max="10" 
                               style="width: 50px; padding: 6px; border-radius: 6px; border: 1px solid #3b82f6; font-weight: bold; text-align: center;">
                        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                            <button class="section-fill-btn" data-type="NHOM" style="padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">👥 Nhập phần Nhóm</button>
                            <button class="section-fill-btn" data-type="CANHAN" style="padding: 6px; background: #1e40af; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">👤 Nhập phần Cá nhân</button>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div id="score-total-row" class="total-row">
                    <div class="bulk-fill-group">
                        <label>Bulk (tất cả):</label>
                        <input type="number" id="score-total-input" min="0" max="10" step="0.1" placeholder="0-10">
                        <button id="score-distribute-btn" class="fill-btn">Fill</button>
                    </div>
                </div>

                <div id="bulk-paste-container" class="paste-container">
                    <button id="toggle-paste-btn" class="toggle-btn">📋 Dán danh sách điểm</button>
                    <div id="paste-area-wrapper" class="paste-wrapper" style="display: none;">
                        <textarea id="bulk-paste-area" placeholder="Dán dãy điểm (cách nhau bởi khoảng trắng hoặc xuống dòng)"></textarea>
                        <button id="apply-paste-btn" class="apply-btn">Áp dụng</button>
                    </div>
                </div>

                <div id="score-sliders-container" class="sliders-container"></div>
            </div>
        `;

        document.body.appendChild(panel);

        const header = panel.querySelector("#score-panel-header");

        // Nút đóng và thu nhỏ
        const closeBtn = panel.querySelector("#score-panel-close");
        const minimizeBtn = panel.querySelector("#score-panel-minimize");
        
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            panel.remove();
        };

        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            const content = panel.querySelector("#score-panel-content");
            if (content.style.display === "none") {
                content.style.display = "block";
                minimizeBtn.textContent = "_";
                panel.style.width = "320px";
            } else {
                content.style.display = "none";
                minimizeBtn.textContent = "□";
                panel.style.width = "150px";
            }
        };

        // Style content
        const content = panel.querySelector("#score-panel-content");
        Object.assign(content.style, {
            padding: "12px",
            maxHeight: "400px",
            overflowY: "auto"
        });

        // Style total row
        const totalRow = panel.querySelector("#score-total-row");
        Object.assign(totalRow.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "15px",
            padding: "10px",
            background: "#FFF3E0",
            borderRadius: "6px"
        });

        const totalInput = panel.querySelector("#score-total-input");
        Object.assign(totalInput.style, {
            width: "80px",
            padding: "6px",
            border: "1px solid #FF9800",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold"
        });

        // Tự động gọi hành vi bấm nút "Vào bảng" khi ô input mất focus
        totalInput.onblur = () => {
            distributeBtn.click();
        };

        const distributeBtn = panel.querySelector("#score-distribute-btn");
        Object.assign(distributeBtn.style, {
            padding: "6px 12px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
        });

        // Xử lý dán hàng loạt
        const togglePasteBtn = panel.querySelector("#toggle-paste-btn");
        const pasteAreaWrapper = panel.querySelector("#paste-area-wrapper");
        const bulkPasteArea = panel.querySelector("#bulk-paste-area");
        const applyPasteBtn = panel.querySelector("#apply-paste-btn");

        togglePasteBtn.onclick = () => {
            pasteAreaWrapper.style.display = pasteAreaWrapper.style.display === "none" ? "block" : "none";
        };

        applyPasteBtn.onclick = () => {
            const text = bulkPasteArea.value.trim();
            if (!text) return;

            // Tách các con số bằng khoảng trắng, dấu phẩy hoặc xuống dòng
            const scores = text.split(/[\s,]+/).map(s => parseFloat(s.replace(',', '.')));
            
            scores.forEach((score, i) => {
                if (i < criteria.length && !isNaN(score)) {
                    updateSliderValue(i, score);
                }
            });
            
            updateTotalDisplay();
            pasteAreaWrapper.style.display = "none";
        };

        // Xử lý fix IAP
        panel.querySelectorAll(".iap-fix-btn").forEach(btn => {
            btn.onclick = () => {
                const section = btn.dataset.section;
                const scoreInput = btn.parentElement.querySelector(".iap-custom-score");
                const score = parseFloat(scoreInput.value);
                
                if (isNaN(score) || score < 0 || score > 10) {
                    alert("Vui lòng nhập điểm hợp lệ (0-10)");
                    return;
                }
                
                criteria.forEach((item, i) => {
                    let match = false;
                    const cType = item.criteriaType;
                    
                    if (section === "TÀI LIỆU DỰ ÁN" && cType === "TAILIEUDUAN") match = true;
                    if (section === "Nhóm" && cType === "NHOM") match = true;
                    if (section === "Cá nhân" && cType === "CANHAN") match = true;
                    if (!match && item.name.includes(section)) match = true;

                    if (match) {
                        updateSliderValue(i, score);
                    }
                });
                
                updateTotalDisplay();
            };
        });

        // Xử lý nhập nhanh các phần
        panel.querySelectorAll(".section-fill-btn").forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                const scoreInput = panel.querySelector("#section-fill-score");
                const score = parseFloat(scoreInput.value);

                if (isNaN(score) || score < 0 || score > 10) {
                    alert("Vui lòng nhập điểm hợp lệ (0-10)");
                    return;
                }

                criteria.forEach((item, i) => {
                    if (item.criteriaType === type) {
                        updateSliderValue(i, score);
                    }
                });

                updateTotalDisplay();
            };
        });

        // Container cho sliders
        const slidersContainer = panel.querySelector("#score-sliders-container");

        // Track các slider đã được kéo (locked)
        const lockedSliders = new Set();
        let currentTotal = 0; // Tổng điểm hiện tại

        // Hàm tính tổng điểm từ sliders
        function calculateTotal() {
            let total = 0;
            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const score = parseFloat(slider.value) || 0;
                total += score * (item.weight / 100);
            });
            return total;
        }

        // Hàm cập nhật hiển thị tổng điểm
        function updateTotalDisplay() {
            currentTotal = calculateTotal();
            totalInput.value = currentTotal.toFixed(1);
        }

        // Hàm redistribute điểm cho các slider chưa lock
        function redistributeUnlockedSliders(changedIndex) {
            const targetTotal = currentTotal; // Giữ nguyên tổng cố định

            // Tính điểm đóng góp từ các slider đã lock (bao gồm slider vừa kéo)
            let lockedContribution = 0;
            let unlockedWeight = 0;

            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const score = parseFloat(slider.value) || 0;

                if (lockedSliders.has(i)) {
                    lockedContribution += score * (item.weight / 100);
                } else {
                    unlockedWeight += item.weight;
                }
            });

            // Điểm còn lại cho các slider chưa lock
            const remainingScore = targetTotal - lockedContribution;

            // Nếu không còn slider nào unlocked
            if (unlockedWeight === 0) {
                // Tổng có thể bị vượt quá targetTotal - hiển thị tổng thực tế
                totalInput.value = calculateTotal().toFixed(1);
                return;
            }

            // Tính điểm cần thiết cho mỗi slider unlocked
            const newScoreForUnlocked = (remainingScore * 100) / unlockedWeight;

            // Clamp giữa 0 và 10
            const clampedScore = Math.max(0, Math.min(10, newScoreForUnlocked));

            // Cập nhật các slider unlocked
            criteria.forEach((item, i) => {
                if (!lockedSliders.has(i)) {
                    const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                    const valueInput = slidersContainer.querySelectorAll(".score-value")[i];

                    slider.value = clampedScore.toFixed(1);
                    valueInput.value = clampedScore.toFixed(1);
                    item.inputElement.value = clampedScore.toFixed(1);
                    item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                    item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });

            // Hiển thị tổng đã tính (có thể khác targetTotal nếu clamp xảy ra)
            totalInput.value = calculateTotal().toFixed(1);
        }

        // Hàm cập nhật một slider và ô điểm trong bảng
        function updateSliderValue(index, value) {
            const item = criteria[index];
            const slider = slidersContainer.querySelectorAll(".score-slider")[index];
            const valueInput = slidersContainer.querySelectorAll(".score-value")[index];

            slider.value = value;
            valueInput.value = parseFloat(value).toFixed(1);
            item.inputElement.value = parseFloat(value).toFixed(1);
            item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
            item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Tạo sliders cho từng tiêu chí
        criteria.forEach((item, index) => {
            const sliderRow = document.createElement("div");
            sliderRow.style.cssText = "margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; position: relative;";

            sliderRow.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span class="criterion-name" style="font-weight: 500; color: #333;">${item.name}</span>
                    <div>
                        <span class="lock-indicator" style="color: #999; font-size: 10px; margin-right: 5px;"></span>
                        <span style="color: #666; font-size: 11px;">Trọng số: ${item.weight}%</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="range" class="score-slider" data-index="${index}" 
                           min="0" max="10" step="0.1" value="${item.inputElement.value || 0}"
                           style="flex: 1; cursor: pointer;">
                    <input type="number" class="score-value" data-index="${index}"
                           min="0" max="10" step="0.1" value="${item.inputElement.value || 0}"
                           style="width: 55px; text-align: center; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
                    <button class="unlock-btn" data-index="${index}" title="Mở khóa" 
                            style="padding: 2px 6px; font-size: 10px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: #fff; display: none;">🔓</button>
                </div>
            `;

            slidersContainer.appendChild(sliderRow);

            const slider = sliderRow.querySelector(".score-slider");
            const valueInput = sliderRow.querySelector(".score-value");
            const lockIndicator = sliderRow.querySelector(".lock-indicator");
            const unlockBtn = sliderRow.querySelector(".unlock-btn");

            // Cập nhật indicator
            function updateLockIndicator() {
                if (lockedSliders.has(index)) {
                    lockIndicator.textContent = "🔒";
                    sliderRow.style.background = "#fff3e0";
                    unlockBtn.style.display = "inline-block";
                } else {
                    lockIndicator.textContent = "";
                    sliderRow.style.background = "#f5f5f5";
                    unlockBtn.style.display = "none";
                }
            }

            // Unlock button
            unlockBtn.onclick = () => {
                lockedSliders.delete(index);
                updateLockIndicator();
            };

            slider.oninput = () => {
                const val = parseFloat(slider.value).toFixed(1);
                valueInput.value = val;
                item.inputElement.value = val;
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Lock slider này
                lockedSliders.add(index);
                updateLockIndicator();

                // Redistribute các slider khác
                redistributeUnlockedSliders(index);
            };

            valueInput.oninput = () => {
                let val = parseFloat(valueInput.value);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 10) val = 10;
                slider.value = val;
                item.inputElement.value = val.toFixed(1);
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Lock slider này
                lockedSliders.add(index);
                updateLockIndicator();

                // Redistribute các slider khác
                redistributeUnlockedSliders(index);
            };
        });

        // Hàm phân chia điểm tổng cho từng tiêu chí
        distributeBtn.onclick = () => {
            const totalScore = parseFloat(totalInput.value);
            if (isNaN(totalScore) || totalScore < 0 || totalScore > 10) {
                alert("Vui lòng nhập tổng điểm từ 0 đến 10");
                return;
            }

            // Reset tất cả locked sliders
            lockedSliders.clear();

            // Phân chia đều cho từng tiêu chí
            criteria.forEach((item, i) => {
                const slider = slidersContainer.querySelectorAll(".score-slider")[i];
                const valueInput = slidersContainer.querySelectorAll(".score-value")[i];
                const sliderRow = slider.closest("div[style*='margin-bottom']");
                const lockIndicator = sliderRow.querySelector(".lock-indicator");
                const unlockBtn = sliderRow.querySelector(".unlock-btn");

                slider.value = totalScore;
                valueInput.value = totalScore.toFixed(1);
                item.inputElement.value = totalScore.toFixed(1);
                item.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                item.inputElement.dispatchEvent(new Event("change", { bubbles: true }));

                // Reset UI
                lockIndicator.textContent = "";
                sliderRow.style.background = "#f5f5f5";
                unlockBtn.style.display = "none";
            });

            // Update currentTotal
            currentTotal = totalScore;
        };

        // Draggable
        let isDragging = false;
        let offsetX, offsetY;

        header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            header.style.cursor = "grabbing";
        };

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            header.style.cursor = "move";
        });

        // Khởi tạo tổng điểm từ giá trị hiện tại
        currentTotal = calculateTotal();
        totalInput.value = currentTotal.toFixed(1);

        console.log("[E360-VUI] Score Input Panel created with", criteria.length, "criteria, initial total:", currentTotal);
    }

    function initScorePage() {
        setTimeout(() => {
            createScoreInputPanel();
        }, 500);
    }


    // Chạy sau khi page load hoàn toàn
    function startExtension() {
        if (isInputScorePage()) {
            initScorePage();
        } else {
            init();
        }
    }

    if (document.readyState === "complete") {
        startExtension();
    } else {
        window.addEventListener("load", startExtension);
    }
})();
