const board = document.getElementById("lottoBoard");
const count = document.getElementById("count");

let selected = [];


// ========================================
// 🔢 번호 1~17 만들기
// ========================================

for (let i = 1; i <= 17; i++) {

    const ball =
        document.createElement("div");

    ball.className = "ball";

    ball.innerText = i;


    ball.onclick = () => {

        if (ball.classList.contains("selected")) {

            ball.classList.remove("selected");

            selected =
                selected.filter(
                    n => n !== i
                );

        } else {

            if (selected.length >= 6) {

                alert(
                    "6개까지만 선택할 수 있습니다."
                );

                return;
            }


            ball.classList.add("selected");

            selected.push(i);
        }


        count.innerText =
            `선택 : ${selected.length} / 6`;
    };


    board.appendChild(ball);
}



// ========================================
// 📅 이번 주 시작 날짜
// ========================================

function getWeekKey() {

    const today = new Date();

    const day = today.getDay();

    const diff =
        day === 0 ? -6 : 1 - day;


    const monday =
        new Date(today);


    monday.setDate(
        today.getDate() + diff
    );


    const year =
        monday.getFullYear();

    const month =
        String(
            monday.getMonth() + 1
        ).padStart(2, "0");

    const date =
        String(
            monday.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${date}`;
}



// ========================================
// 🎟️ 현재 학생의 이번 주 로또 가져오기
// ========================================

function getTickets() {

    const studentId =
        localStorage.getItem("studentId");


    if (!studentId) {
        return [];
    }


    const weekKey =
        getWeekKey();


    const saved =
        localStorage.getItem(
            `tickets_${weekKey}_${studentId}`
        );


    if (!saved) {
        return [];
    }


    return JSON.parse(saved);
}



// ========================================
// 📤 로또 제출
// ========================================

const submitBtn =
    document.getElementById("submitBtn");


// ========================================
// 🔒 제출 가능 여부 확인
// ========================================

function checkSubmitStatus() {

    const studentId =
        localStorage.getItem("studentId");


    if (!studentId) {
        return;
    }


    const submitLocked =
        localStorage.getItem(
            `submitLocked_${studentId}`
        ) === "true";


    if (submitLocked) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "🔒 제출 확인 대기 중";

    } else {

        submitBtn.disabled = false;

        submitBtn.innerText =
            "제출하기";
    }
}



// ========================================
// 📤 제출 버튼
// ========================================

submitBtn.onclick = () => {

    const studentId =
        localStorage.getItem("studentId");


    const submitLocked =
        localStorage.getItem(
            `submitLocked_${studentId}`
        ) === "true";


    if (submitLocked) {

        alert(
            "아직 이전 로또의 확인이 완료되지 않았습니다.\n\n" +
            "관리자에게 확인을 요청해주세요."
        );

        return;
    }


    // 6개 선택 확인
    if (selected.length !== 6) {

        alert(
            "번호를 6개 선택해주세요."
        );

        return;
    }


    if (!studentId) {

        alert(
            "학번 정보를 찾을 수 없습니다."
        );

        return;
    }


    const weekKey =
        getWeekKey();


    const storageKey =
        `tickets_${weekKey}_${studentId}`;


    let tickets =
        getTickets();


    const now =
        new Date();


    const submittedAt =
        now.toLocaleString("ko-KR");


    // 새로운 로또 추가
    tickets.push({

        numbers: [...selected],

        submittedAt: submittedAt
    });


    // 저장
    localStorage.setItem(
        storageKey,
        JSON.stringify(tickets)
    );


    // 🔒 제출 잠금
    localStorage.setItem(
        `submitLocked_${studentId}`,
        "true"
    );


    alert(
        `${tickets.length}번째 로또 제출 완료!\n\n` +
        selected.join(", ") +
        `\n\n` +
        "관리자 확인 후 다음 로또를 제출할 수 있습니다."
    );


    // 번호 선택 초기화
    selected = [];


    document
        .querySelectorAll(".ball")
        .forEach(ball => {

            ball.classList.remove(
                "selected"
            );
        });


    count.innerText =
        "선택 : 0 / 6";


    checkSubmitStatus();

    // 제출 후 결과 화면 갱신
    showMyResults();
};



// ========================================
// 🏆 당첨 결과 계산
// ========================================

function showMyResults() {

    const resultBox =
        document.getElementById("myResults");


    if (!resultBox) {
        return;
    }


    resultBox.innerHTML = "";


    // 현재 학생
    const studentId =
        localStorage.getItem("studentId");


    if (!studentId) {
        return;
    }


    // 추첨 결과 가져오기
    const savedDraw =
        localStorage.getItem("drawResult");


    // 아직 추첨하지 않았다면
    if (!savedDraw) {

        const text =
            document.createElement("p");

        text.innerText =
            "🎲 아직 추첨 결과가 없습니다.";

        resultBox.appendChild(text);

        return;
    }


let drawData =
    JSON.parse(savedDraw);


// 예전 버전 데이터 대응
if (Array.isArray(drawData)) {

    drawData = {

        date: "이전 추첨",

        numbers: drawData
    };
}


    const tickets =
        getTickets();


    // 제출한 로또가 없다면
    if (tickets.length === 0) {

        const text =
            document.createElement("p");

        text.innerText =
            "아직 제출한 로또가 없습니다.";

        resultBox.appendChild(text);

        return;
    }


    // ========================================
    // 🎉 추첨 결과 제목
    // ========================================

    const title =
        document.createElement("h2");

    title.innerText =
        `🏆 ${drawData.date} 결과`;

    resultBox.appendChild(title);


    const winningNumbers =
        document.createElement("p");

    winningNumbers.innerText =
        `당첨 번호: ${drawData.numbers.join(", ")}`;

    resultBox.appendChild(
        winningNumbers
    );


    // ========================================
    // 🎟️ 각각의 로또 당첨 결과
    // ========================================

    tickets.forEach((ticket, index) => {

        const ticketBox =
            document.createElement("div");

        ticketBox.className =
            "my-result-ticket";


        // 맞은 번호 개수
        const matchCount =
            ticket.numbers.filter(
                number =>
                    drawData.numbers.includes(number)
            ).length;


        const ticketTitle =
            document.createElement("p");

        ticketTitle.innerText =
            `${index + 1}장: ` +
            ticket.numbers.join(", ");

        ticketBox.appendChild(
            ticketTitle
        );


        // ====================================
        // 🏆 당첨 여부
        // ====================================

        const result =
            document.createElement("strong");


        if (matchCount === 6) {

            result.innerText =
                "🎉🎉 6개 당첨!";

        } else if (matchCount === 5) {

            result.innerText =
                "🎉 5개 당첨!";

        } else {

            result.innerText =
                `${matchCount}개 일치`;

        }


        ticketBox.appendChild(
            result
        );


        resultBox.appendChild(
            ticketBox
        );
    });
}



// ========================================
// 📂 페이지를 열었을 때
// ========================================

checkSubmitStatus();

showMyResults();