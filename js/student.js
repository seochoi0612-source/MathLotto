const board = document.getElementById("lottoBoard");
const count = document.getElementById("count");
const submitBtn = document.getElementById("submitBtn");

const db = supabaseClient;

let selected = [];


// ========================================
// 🔢 번호 불러오기
// ========================================

async function getLottoNumbers() {

    const { data, error } = await db
        .from("settings")
        .select("numbers")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("번호 불러오기 오류:", error);

        return Array.from(
            { length: 17 },
            (_, i) => i + 1
        );
    }

    if (
        data &&
        Array.isArray(data.numbers) &&
        data.numbers.length > 0
    ) {
        return data.numbers;
    }

    return Array.from(
        { length: 17 },
        (_, i) => i + 1
    );
}


// ========================================
// 🔢 번호판
// ========================================

async function createLottoBoard() {

    const lottoNumbers = await getLottoNumbers();

    board.innerHTML = "";

    lottoNumbers.forEach(number => {

        const ball = document.createElement("div");

        ball.className = "ball";
        ball.innerText = number;

        ball.onclick = () => {

            if (ball.classList.contains("selected")) {

                ball.classList.remove("selected");

                selected = selected.filter(
                    n => n !== number
                );

            } else {

                if (selected.length >= 6) {

                    alert("6개까지만 선택할 수 있습니다.");
                    return;
                }

                ball.classList.add("selected");
                selected.push(number);
            }

            count.innerText =
                `선택 : ${selected.length} / 6`;
        };

        board.appendChild(ball);
    });
}


// ========================================
// 👩‍🎓 학번
// ========================================

function getStudentId() {

    return localStorage.getItem("studentId");
}


// ========================================
// 🎟️ 내 로또
// ========================================

async function getTickets() {

    const studentId = getStudentId();

    if (!studentId) {
        return [];
    }

    const { data, error } = await db
        .from("tickets")
        .select("*")
        .eq("student_id", studentId)
        .order("id", { ascending: true });

    if (error) {

        console.error(
            "로또 불러오기 오류:",
            error
        );

        return [];
    }

    return data || [];
}


// ========================================
// 🔒 제출 가능 여부
// ========================================

async function checkSubmitStatus() {

    const tickets = await getTickets();

    if (tickets.length === 0) {

        submitBtn.disabled = false;
        submitBtn.innerText = "제출하기";

        return;
    }

    const latestTicket =
        tickets[tickets.length - 1];

    if (latestTicket.confirmed === true) {

        submitBtn.disabled = false;
        submitBtn.innerText = "제출하기";

    } else {

        submitBtn.disabled = true;
        submitBtn.innerText =
            "🔒 관리자 확인 대기 중";
    }
}


// ========================================
// 📤 로또 제출
// ========================================

submitBtn.onclick = async () => {

    const studentId = getStudentId();

    if (!studentId) {

        alert("학번 정보를 찾을 수 없습니다.");
        return;
    }

    if (selected.length !== 6) {

        alert("번호를 6개 선택해주세요.");
        return;
    }


    // 최신 제출 확인
    const tickets = await getTickets();

    if (tickets.length > 0) {

        const latestTicket =
            tickets[tickets.length - 1];

        if (latestTicket.confirmed !== true) {

            alert(
                "아직 이전 로또의 확인이 완료되지 않았습니다.\n\n" +
                "관리자에게 확인을 요청해주세요."
            );

            return;
        }
    }


    const { data, error } = await db
        .from("tickets")
        .insert({
            student_id: studentId,
            numbers: selected,
            submitted_at: new Date().toISOString(),
            confirmed: false
        })
        .select();


    if (error) {

        console.error(
            "로또 제출 오류:",
            error
        );

        alert("로또 제출에 실패했습니다.");
        return;
    }


    alert(
        `${data[0].numbers.join(", ")}\n\n` +
        "로또 제출 완료!\n" +
        "관리자 확인 후 다음 로또를 제출할 수 있습니다."
    );


    selected = [];

    document
        .querySelectorAll(".ball")
        .forEach(ball => {
            ball.classList.remove("selected");
        });

    count.innerText = "선택 : 0 / 6";

    await checkSubmitStatus();
    await showMyResults();
};


// ========================================
// 🏆 결과
// ========================================

async function showMyResults() {

    const resultBox =
        document.getElementById("myResults");

    if (!resultBox) {
        return;
    }

    resultBox.innerHTML = "";

    const studentId = getStudentId();

    if (!studentId) {
        return;
    }


    // 현재는 추첨 결과를 localStorage에서 읽지 않고
    // 아래 draw_results 테이블에서 읽음

    const { data: drawData, error: drawError } =
        await db
            .from("draw_results")
            .select("*")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();


    if (drawError) {

        console.error(
            "추첨 결과 불러오기 오류:",
            drawError
        );

        resultBox.innerHTML =
            "<p>🎲 아직 추첨 결과가 없습니다.</p>";

        return;
    }


    if (!drawData) {

        resultBox.innerHTML =
            "<p>🎲 아직 추첨 결과가 없습니다.</p>";

        return;
    }


    const tickets = await getTickets();

    if (tickets.length === 0) {

        resultBox.innerHTML =
            "<p>아직 제출한 로또가 없습니다.</p>";

        return;
    }


    const title = document.createElement("h2");

    title.innerText =
        `🏆 ${drawData.draw_date} 결과`;

    resultBox.appendChild(title);


    const winningNumbers =
        document.createElement("p");

    winningNumbers.innerText =
        `당첨 번호: ${drawData.numbers.join(", ")}`;

    resultBox.appendChild(winningNumbers);


    tickets.forEach((ticket, index) => {

        const ticketBox =
            document.createElement("div");

        ticketBox.className =
            "my-result-ticket";


        const numbers =
            Array.isArray(ticket.numbers)
                ? ticket.numbers
                : [];


        const matchCount =
            numbers.filter(
                number =>
                    drawData.numbers.includes(number)
            ).length;


        const ticketTitle =
            document.createElement("p");

        ticketTitle.innerText =
            `${index + 1}장: ${numbers.join(", ")}`;

        ticketBox.appendChild(ticketTitle);


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


        ticketBox.appendChild(result);

        resultBox.appendChild(ticketBox);
    });
}


// ========================================
// 🚀 시작
// ========================================

createLottoBoard();
checkSubmitStatus();
showMyResults();
