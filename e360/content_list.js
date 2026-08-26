console.log("--> E360 List Script Loaded (Inline UI Version & Iframe Save)");

let studentData = [];

// --- HIDE UNWANTED COLUMNS ---
const style = document.createElement('style');
style.innerHTML = `
    /* Hide specific table columns: 1 (STT), 2 (Avatar), 5 (Môn thi), 6 (AF/CC), 7 (Ghi chú), 9 (Ghi chú điểm danh), 11 (Nhận xét) */
    #checkInTable th:nth-child(1), #checkInTable td:nth-child(1),
    #checkInTable th:nth-child(2), #checkInTable td:nth-child(2),
    #checkInTable th:nth-child(5), #checkInTable td:nth-child(5),
    #checkInTable th:nth-child(6), #checkInTable td:nth-child(6),
    #checkInTable th:nth-child(7), #checkInTable td:nth-child(7),
    #checkInTable th:nth-child(9), #checkInTable td:nth-child(9),
    #checkInTable th:nth-child(11), #checkInTable td:nth-child(11) {
        display: none !important;
    }

    /* Adjust remaining columns */
    #checkInTable { width: 100% !important; table-layout: auto; }
`;
document.head.appendChild(style);

// --- INJECT INLINE UI ---
function injectInlineUI() {
    const rows = document.querySelectorAll('#checkInTable tbody tr');

    let injectedCount = 0;

    rows.forEach(row => {
        let targetCell = null;
        let studentId = null;
        let asmScore = '';
        let studentName = "No Name";

        if (row.cells && row.cells.length > 3) {
            studentName = row.cells[3].innerText.trim();
        }

        for (let cell of row.cells) {
            const html = cell.innerHTML;
            const match = html.match(/InputScore\((\d+)\)/);
            if (match && match[1]) {
                targetCell = cell;
                studentId = match[1];

                const asmMatch = html.match(/ASM:\s*([\d\.]+)/);
                if (asmMatch && asmMatch[1]) {
                    asmScore = asmMatch[1];
                }
                break;
            }
        }

        if (targetCell && studentId) {
            if (!studentData.find(x => x.id === studentId)) {
                studentData.push({ id: studentId, name: studentName, status: 'pending', score: asmScore });
            }

            if (!targetCell.querySelector('.e360-inline-container')) {
                const container = document.createElement('div');
                container.className = 'e360-inline-container';
                container.style.marginTop = '8px';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';

                container.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <input type="text" class="e360-individual-score" data-id="${studentId}" value="${asmScore}" style="width: 45px; height: 28px; text-align: center; border: 1px solid #ccc; border-radius: 3px; padding: 2px 4px; font-size: 14px; box-sizing: border-box; outline: none;">
                        <button class="e360-btn-x2" data-id="${studentId}" type="button" style="background-color: #f39c12; color: white; border: none; padding: 0 8px; height: 28px; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 28px;" title="Nhân đôi (0-5)">x2</button>
                        <button class="e360-btn-save-one" data-id="${studentId}" type="button" style="background-color: #00a65a; color: white; border: none; padding: 0 10px; height: 28px; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 28px;" title="Lưu điểm">Lưu</button>
                    </div>
                    <div class="e360-status" data-id="${studentId}" style="font-size: 12px; color: #666; margin-top: 4px; display: none; font-weight: bold;"></div>
                `;
                targetCell.appendChild(container);

                targetCell.style.textAlign = 'center';
                targetCell.style.verticalAlign = 'middle';
                injectedCount++;
            }
        }
    });

    if (injectedCount > 0) {
        console.log(`--> [InjectUI] Đã chèn UI cho ${injectedCount} sinh viên.`);
    }
}

// --- HIDDEN IFRAME LOGIC ---
function saveScoreViaIframe(studentId, score, callback) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.left = '-9999px';
    iframe.style.opacity = '0';
    iframe.style.border = 'none';
    iframe.src = "/Proctor/InputScore?sssID=" + studentId;
    //----------hiện iframe để test
    // function saveScoreViaIframe(studentId, score, callback) {
    //     const iframe = document.createElement('iframe');
    //     // --- Bật hiển thị Iframe để debug ---
    //     iframe.style.position = 'fixed';
    //     iframe.style.top = '10%';
    //     iframe.style.left = '10%';
    //     iframe.style.width = '80%';
    //     iframe.style.height = '80%';
    //     iframe.style.zIndex = '999999';
    //     iframe.style.border = '5px solid red';
    //     iframe.style.background = 'white';
    //     // ------------------------------------
    //     iframe.src = "/Proctor/InputScore?sssID=" + studentId;

    document.body.appendChild(iframe);

    let isDone = false;
    let loadCount = 0;

    const timeout = setTimeout(() => {
        if (!isDone) {
            isDone = true;
            if (iframe.parentNode) document.body.removeChild(iframe);
            callback(false, "Timeout");
        }
    }, 15000);

    iframe.onload = () => {
        if (isDone) return;
        loadCount++;
        if (loadCount > 1) return;

        try {
            const idoc = iframe.contentDocument || iframe.contentWindow.document;
            setTimeout(() => {
                if (isDone) return;
                try {
                    const inputs = idoc.querySelectorAll('input[id^="txtScore_"]');
                    if (inputs.length === 0) {
                        isDone = true;
                        clearTimeout(timeout);
                        if (iframe.parentNode) document.body.removeChild(iframe);
                        callback(false, "Không tìm thấy form điểm");
                        return;
                    }

                    inputs.forEach(input => {
                        input.value = score;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        input.dispatchEvent(new Event('blur', { bubbles: true }));
                    });

                    // Bấm nút lưu và xử lý popup xác nhận
                        // Sau khi override xong, click nút lưu
                        const saveBtn = idoc.querySelector('button[onclick*="SaveAllScore"]') || idoc.querySelector('button.btn-primary') || idoc.querySelector('button[type="submit"]');
                        if (saveBtn) {
                            saveBtn.click();

                            // Mới thêm: Chờ popup HTML hiện lên rồi tự động click "Xác nhận"
                            setTimeout(() => {
                                const buttons = Array.from(idoc.querySelectorAll('button'));
                                const confirmBtn = buttons.find(b => b.innerText && b.innerText.includes('Xác nhận'));
                                if (confirmBtn) {
                                    confirmBtn.click();
                                }

                                // Sau khi bấm xác nhận, chờ 1.5s cho server xử lý lưu điểm rồi đóng iframe
                                setTimeout(() => {
                                    if (!isDone) {
                                        isDone = true;
                                        clearTimeout(timeout);
                                        if (iframe.parentNode) document.body.removeChild(iframe);
                                        callback(true);
                                    }
                                }, 1500);
                            }, 500); // Chờ 500ms cho popup animation (nếu có) hiện ra

                        } else {
                            // Fallback: Thử submit form trực tiếp nếu không thấy nút
                            const form = idoc.querySelector('form');
                            if (form) {
                                form.submit();
                                setTimeout(() => {
                                    if (!isDone) {
                                        isDone = true;
                                        clearTimeout(timeout);
                                        if (iframe.parentNode) document.body.removeChild(iframe);
                                        callback(true);
                                    }
                                }, 1500);
                            } else {
                                isDone = true;
                                clearTimeout(timeout);
                                if (iframe.parentNode) document.body.removeChild(iframe);
                                callback(false, "Không thấy nút lưu hoặc form");
                            }
                        }
                } catch (e) {
                    isDone = true;
                    clearTimeout(timeout);
                    if (iframe.parentNode) document.body.removeChild(iframe);
                    callback(false, "Lỗi iframe: " + e.message);
                }
            }, 500);
        } catch (e) {
            isDone = true;
            clearTimeout(timeout);
            if (iframe.parentNode) document.body.removeChild(iframe);
            callback(false, "Lỗi Cross-Origin: " + e.message);
        }
    };
}

// --- SỰ KIỆN XỬ LÝ ---
document.addEventListener('click', (e) => {
    // Xử lý nút Lưu
    const btnSave = e.target.closest('.e360-btn-save-one');
    if (btnSave) {
        e.preventDefault();
        e.stopPropagation();

        const id = btnSave.getAttribute('data-id');
        const s = studentData.find(x => x.id === id);
        const input = document.querySelector(`.e360-individual-score[data-id="${id}"]`);
        const statusDiv = document.querySelector(`.e360-status[data-id="${id}"]`);

        if (!s || !input || !statusDiv) return;

        s.score = input.value.trim();

        if (s.score === "") {
            alert("⚠️ Chưa có điểm cho sinh viên này!");
            return;
        }

        const scoreNum = parseFloat(s.score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
            alert("⚠️ Điểm không hợp lệ! (Phải từ 0-10)");
            input.style.border = '2px solid red';
            input.style.backgroundColor = '#ffe6e6';
            return;
        } else {
            input.style.border = '1px solid #ccc';
            input.style.backgroundColor = '#fff';
        }

        // Đã áp dụng cách iframe ngầm, không cần gửi message sang background.js nữa
        const originalText = btnSave.innerText;
        const originalBg = btnSave.style.backgroundColor;

        btnSave.innerText = "...";
        btnSave.disabled = true;
        btnSave.style.backgroundColor = '#999';

        statusDiv.style.display = 'block';
        statusDiv.innerText = 'Đang cập nhật...';
        statusDiv.style.color = '#f39c12'; // Màu cam

        saveScoreViaIframe(id, s.score, (success, msg) => {
            btnSave.innerText = originalText;
            btnSave.disabled = false;
            btnSave.style.backgroundColor = originalBg;

            if (success) {
                console.log(`--> [AuTo] Cập nhật xong ${s.name}`);
                statusDiv.innerText = '✅ xong';
                statusDiv.style.color = '#00a65a'; // Màu xanh lá
                input.style.backgroundColor = '#dff0d8';
                setTimeout(() => {
                    input.style.backgroundColor = '#fff';
                }, 2000);
            } else {
                console.error(`--> [AuTo] Lỗi cập nhật ${s.name}: ${msg}`);
                statusDiv.innerText = 'Lỗi: ' + msg;
                statusDiv.style.color = 'red';
                input.style.border = '2px solid red';
            }
        });
        return;
    }

    // Xử lý nút x2
    const btnX2 = e.target.closest('.e360-btn-x2');
    if (btnX2) {
        e.preventDefault();
        e.stopPropagation();

        const id = btnX2.getAttribute('data-id');
        const input = document.querySelector(`.e360-individual-score[data-id="${id}"]`);
        if (!input) return;

        let currentVal = parseFloat(input.value);

        if (isNaN(currentVal)) {
            alert("⚠️ Chưa có điểm hợp lệ để nhân đôi!");
            return;
        }

        if (currentVal < 0 || currentVal > 5) {
            alert(`⚠️ Chỉ hỗ trợ nhân đôi nếu điểm nằm trong khoảng 0 - 5.\n(Điểm hiện tại: ${currentVal})`);
            return;
        }

        const newVal = currentVal * 2;
        input.value = newVal;

        const s = studentData.find(x => x.id === id);
        if (s) s.score = newVal;

        input.style.backgroundColor = '#dff0d8';
        setTimeout(() => {
            input.style.backgroundColor = '#fff';
        }, 500);
        return;
    }
});

// Lắng nghe sự kiện input để cập nhật data
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('e360-individual-score')) {
        const id = e.target.getAttribute('data-id');
        const s = studentData.find(x => x.id === id);
        if (s) {
            s.score = e.target.value.trim();
            e.target.style.border = '1px solid #ccc';
            e.target.style.backgroundColor = '#fff';
        }
    }
});

// Chạy inject UI sau khi trang load
setTimeout(injectInlineUI, 500);

const observer = new MutationObserver((mutations) => {
    let shouldInject = false;
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            shouldInject = true;
            break;
        }
    }
    if (shouldInject) {
        clearTimeout(window.e360InjectTimer);
        window.e360InjectTimer = setTimeout(injectInlineUI, 300);
    }
});

observer.observe(document.body, { childList: true, subtree: true });