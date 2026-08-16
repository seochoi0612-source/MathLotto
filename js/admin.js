const studentList = document.getElementById("studentList");


// ========================================
// 📅 이번 주 시작 날짜 구하기
// ========================================

function getWeekKey() {

    const today = new Date();

    const day = today.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);

    monday.setDate(today.getDate() + diff);

    const year = monday.getFullYear();

    const month =
        String(monday.getMonth() + 1).padStart(2, "0");

    const date =
        String(monday.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
}


// ========================================
// 👩‍🎓 학생 목록
// ========================================

for (let i = 1; i <= 19; i++) {

    const studentId =
        "26" + String(i).padStart(2, "0");


    const student =
        document.createElement("div");

    student.className = "student";


    // 학번
    const idText =
        document.createElement("span");

    idText.className = "student-id";

    idText.innerText = studentId;


    // 확인 상태
    const status =
        document.createElement("span");

    status.className = "status";


    // 확인 버튼
    const button =
        document.createElement("button");

    button.className = "confirm-btn";


    // ========================================
    // 학생 상태 업데이트
    // ========================================

    function updateStatus() {

        const confirmed =
            localStorage.getItem(
                "confirmed_" + studentId
            ) === "true";


        const submitLocked =
            localStorage.getItem(
                `submitLocked_${studentId}`
            ) === "true";


        // 이번 주 로또 가져오기
        const weekKey = getWeekKey();

        const savedTickets =
            localStorage.getItem(
                `tickets_${weekKey}_${studentId}`
            );


        // 기존 로또 표시 삭제
        const oldTickets =
            student.querySelector(".tickets");

        if (oldTickets) {
            oldTickets.remove();
        }


        // ========================================
        // ✅ 학생 인증 상태
        // ========================================

        if (confirmed) {

            status.innerText =
                "✅ 확인됨";

            status.className =
                "status confirmed";


            // 제출 잠금 상태라면
            // 다음 제출을 허용하는 버튼
            if (submitLocked) {

                button.innerText =
                    "다음 제출 허용";

                button.classList.add("cancel");

            } else {

                button.innerText =
                    "확인";

                button.classList.remove("cancel");
            }

        } else {

            status.innerText =
                "미확인";

            status.className =
                "status not-confirmed";

            button.innerText =
                "확인";

            button.classList.remove("cancel");
        }


        // ========================================
        // 🎟️ 로또 제출 현황
        // ========================================

        if (savedTickets) {

            const tickets =
                JSON.parse(savedTickets);


            const ticketsBox =
                document.createElement("div");

            ticketsBox.className =
                "tickets";


            const title =
                document.createElement("div");

            title.className =
                "tickets-title";

            title.innerText =
                `🔴 로또 ${tickets.length}장 제출`;

            ticketsBox.appendChild(title);


            // 각각의 로또 번호 표시
            tickets.forEach((ticket, index) => {

                const ticketText =
                    document.createElement("div");

                ticketText.className =
                    "ticket";

                ticketText.innerText =
                    `${index + 1}장: ` +
                    ticket.numbers.join(", ");

                ticketsBox.appendChild(ticketText);
            });


            // 제출 잠금 상태 표시
            if (submitLocked) {

                const lockedText =
                    document.createElement("div");

                lockedText.className =
                    "ticket-locked";

                lockedText.innerText =
                    "🔒 다음 로또 제출 대기 중";

                ticketsBox.appendChild(
                    lockedText
                );
            }


            student.appendChild(
                ticketsBox
            );

        } else {

            const noTicket =
                document.createElement("div");

            noTicket.className =
                "tickets no-ticket";

            noTicket.innerText =
                "⚪ 로또 미제출";

            student.appendChild(
                noTicket
            );
        }
    }


    // ========================================
    // ✅ 확인 버튼
    // ========================================

    button.addEventListener(
        "click",
        function () {

            const confirmed =
                localStorage.getItem(
                    "confirmed_" + studentId
                ) === "true";


            const submitLocked =
                localStorage.getItem(
                    `submitLocked_${studentId}`
                ) === "true";


            // ====================================
            // ① 아직 인증하지 않은 학생
            // ====================================

            if (!confirmed) {

                localStorage.setItem(
                    "confirmed_" + studentId,
                    "true"
                );

                alert(
                    `${studentId} 학생이 확인되었습니다.\n` +
                    "이제 로또를 제출할 수 있습니다."
                );
            }


            // ====================================
            // ② 이미 인증했고 제출이 잠긴 경우
            // ====================================

            else if (submitLocked) {

                // 🔓 다음 로또 제출 허용
                localStorage.removeItem(
                    `submitLocked_${studentId}`
                );

                alert(
                    `${studentId} 학생의 다음 로또 제출이 허용되었습니다.`
                );
            }


            // ====================================
            // ③ 이미 인증했고 제출도 잠기지 않은 경우
            // ====================================

            else {

                // 현재는 아무것도 하지 않음
                // 인증 상태를 실수로 취소하지 않도록 함

                alert(
                    `${studentId} 학생은 이미 확인되었습니다.`
                );
            }


            updateStatus();
        }
    );


    // 학생 화면에 추가
    student.appendChild(idText);
    student.appendChild(status);
    student.appendChild(button);

    studentList.appendChild(student);

    updateStatus();
}



// ========================================
// 🎲 추첨
// ========================================

const drawBtn =
    document.getElementById("drawBtn");

const drawInfo =
    document.getElementById("drawInfo");

const drawResult =
    document.getElementById("drawResult");


// ========================================
// 🎉 추첨 결과 표시
// ========================================

function showDrawResult(drawData) {

    drawInfo.innerText =
        `🎉 ${drawData.date} 추첨 결과`;


    drawResult.innerHTML = "";


    drawData.numbers.forEach(number => {

        const ball =
            document.createElement("span");

        ball.className =
            "draw-number";

        ball.innerText =
            number;

        drawResult.appendChild(ball);
    });
}



// ========================================
// 📂 기존 추첨 결과 불러오기
// ========================================

function loadDrawResult() {

    const savedResult =
        localStorage.getItem("drawResult");


    if (!savedResult) {
        return;
    }


    const drawData =
        JSON.parse(savedResult);


    // 이전 버전 데이터 대응
    if (Array.isArray(drawData)) {

        showDrawResult({

            date: "이전 추첨",

            numbers: drawData
        });

        return;
    }


    showDrawResult(drawData);
}



// ========================================
// 🎲 추첨하기
// ========================================

drawBtn.addEventListener(
    "click",
    function () {


        // 실수 방지 확인창
        const confirmed =
            confirm(
                "정말 추첨하시겠습니까?\n\n" +
                "추첨을 진행하면 새로운 당첨 번호가 결정됩니다."
            );


        if (!confirmed) {
            return;
        }


        // ====================================
        // 1~17 중 랜덤 6개
        // ====================================

        const numbers = [];


        while (numbers.length < 6) {

            const number =
                Math.floor(
                    Math.random() * 17
                ) + 1;


            if (!numbers.includes(number)) {

                numbers.push(number);
            }
        }


        // 작은 숫자부터 정렬
        numbers.sort(
            (a, b) => a - b
        );


        // ====================================
        // 📅 추첨 날짜
        // ====================================

        const today =
            new Date();


        const year =
            today.getFullYear();

        const month =
            today.getMonth() + 1;

        const date =
            today.getDate();


        const dateText =
            `${year}년 ${month}월 ${date}일`;


        // 날짜 + 번호 저장
        const drawData = {

            date: dateText,

            numbers: numbers
        };


        localStorage.setItem(
            "drawResult",
            JSON.stringify(drawData)
        );


        // 화면 표시
        showDrawResult(drawData);
    }
);



// ========================================
// 📂 페이지를 열었을 때 결과 불러오기
// ========================================

loadDrawResult();



// ========================================
// ⚙️ 전체 데이터 초기화
// ========================================

const resetAllBtn =
    document.getElementById("resetAllBtn");


resetAllBtn.addEventListener(
    "click",
    function () {


        const confirmed =
            confirm(
                "⚠️ 정말 전체 데이터를 초기화하시겠습니까?\n\n" +
                "학생 확인 상태, 제출 번호,\n" +
                "추첨 결과가 모두 삭제됩니다."
            );


        if (!confirmed) {
            return;
        }


        // 2601 ~ 2619
        for (let i = 1; i <= 19; i++) {

            const studentId =
                "26" +
                String(i).padStart(2, "0");


            // 학생 확인 상태 삭제
            localStorage.removeItem(
                "confirmed_" + studentId
            );


            // 예전 데이터 삭제
            localStorage.removeItem(
                "submitted_" + studentId
            );


            // 제출 잠금 삭제
            localStorage.removeItem(
                `submitLocked_${studentId}`
            );


            // 이번 주 로또 삭제
            const weekKey =
                getWeekKey();


            localStorage.removeItem(
                `tickets_${weekKey}_${studentId}`
            );
        }


        // 추첨 결과 삭제
        localStorage.removeItem(
            "drawResult"
        );


        alert(
            "전체 데이터가 초기화되었습니다."
        );


        location.reload();
    }
);