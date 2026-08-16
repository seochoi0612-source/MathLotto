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

            else if (submitLocked) {

                localStorage.removeItem(
                    `submitLocked_${studentId}`
                );

                alert(
                    `${studentId} 학생의 다음 로또 제출이 허용되었습니다.`
                );

            }

            else {

                alert(
                    `${studentId} 학생은 이미 확인되었습니다.`
                );
            }


            updateStatus();
        }
    );


    student.appendChild(idText);
    student.appendChild(status);
    student.appendChild(button);

    studentList.appendChild(student);

    updateStatus();
}



// ========================================
// 🔢 번호 관리
// ========================================

const numberInput =
    document.getElementById("numberInput");

const saveNumbersBtn =
    document.getElementById("saveNumbersBtn");

const numberStatus =
    document.getElementById("numberStatus");


// 현재 번호 가져오기
function getLottoNumbers() {

    const saved =
        localStorage.getItem("lottoNumbers");


    // 처음에는 1~17
    if (!saved) {

        return Array.from(
            { length: 17 },
            (_, i) => i + 1
        );
    }


    return JSON.parse(saved);
}


// 현재 번호 표시
function loadNumberSettings() {

    const numbers =
        getLottoNumbers();


    numberInput.value =
        numbers.join(",");


    numberStatus.innerText =
        `현재 번호: ${numbers.join(", ")}`;
}


// 번호 저장
saveNumbersBtn.addEventListener(
    "click",
    function () {

        const input =
            numberInput.value.trim();


        if (!input) {

            alert(
                "번호를 입력해주세요."
            );

            return;
        }


        const numbers =
            input
                .split(",")
                .map(number => number.trim())
                .filter(number => number !== "")
                .map(number => Number(number));


        // 숫자인지 확인
        if (
            numbers.some(
                number =>
                    !Number.isInteger(number)
            )
        ) {

            alert(
                "번호는 숫자로 입력해주세요."
            );

            return;
        }


        // 중복 확인
        const uniqueNumbers =
            [...new Set(numbers)];


        if (
            uniqueNumbers.length !== numbers.length
        ) {

            alert(
                "같은 번호를 중복해서 입력할 수 없습니다."
            );

            return;
        }


        // 최소 6개
        if (numbers.length < 6) {

            alert(
                "번호는 최소 6개 이상 입력해주세요."
            );

            return;
        }


        // 저장
        localStorage.setItem(
            "lottoNumbers",
            JSON.stringify(numbers)
        );


        alert(
            "번호가 저장되었습니다!"
        );


        loadNumberSettings();
    }
);


loadNumberSettings();



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

        const confirmed =
            confirm(
                "정말 추첨하시겠습니까?\n\n" +
                "추첨을 진행하면 새로운 당첨 번호가 결정됩니다."
            );


        if (!confirmed) {
            return;
        }


        // ====================================
        // 🔢 설정된 번호 중 랜덤 6개
        // ====================================

        const availableNumbers =
            getLottoNumbers();


        if (availableNumbers.length < 6) {

            alert(
                "추첨하려면 최소 6개의 번호가 필요합니다."
            );

            return;
        }


        const numbers = [];


        while (numbers.length < 6) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    availableNumbers.length
                );


            const number =
                availableNumbers[randomIndex];


            if (!numbers.includes(number)) {

                numbers.push(number);
            }
        }


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


        const drawData = {

            date: dateText,

            numbers: numbers
        };


        localStorage.setItem(
            "drawResult",
            JSON.stringify(drawData)
        );


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


            localStorage.removeItem(
                "confirmed_" + studentId
            );


            localStorage.removeItem(
                "submitted_" + studentId
            );


            localStorage.removeItem(
                `submitLocked_${studentId}`
            );


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


        // 번호 설정도 기본값으로 되돌림
        localStorage.removeItem(
            "lottoNumbers"
        );


        alert(
            "전체 데이터가 초기화되었습니다."
        );


        location.reload();
    }
);
