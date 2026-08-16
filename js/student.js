const board = document.getElementById("lottoBoard");
const count = document.getElementById("count");
const submitBtn = document.getElementById("submitBtn");

const db = supabaseClient;

let selected = [];


// ========================================
// 🔢 기본 번호
// ========================================

const DEFAULT_NUMBERS =
    Array.from(
        { length: 17 },
        (_, i) => i + 1
    );


// ========================================
// 🔢 번호 불러오기
// ========================================

async function getLottoNumbers() {

    const { data, error } =
        await db
            .from("settings")
            .select("numbers")
            .order("id", {
                ascending: true
            })
            .limit(1)
            .maybeSingle();

    if (error) {

        console.error(
            "번호 불러오기 오류:",
            error
        );

        return DEFAULT_NUMBERS;
    }

    if (
        data &&
        Array.isArray(data.numbers) &&
        data.numbers.length > 0
    ) {

        return data.numbers;
    }

    return DEFAULT_NUMBERS;
}


// ========================================
// 🔢 번호판 만들기
// ========================================

async function createLottoBoard() {

    if (!board) {
        return;
    }

    const lottoNumbers =
        await getLottoNumbers();

    board.innerHTML = "";

    lottoNumbers.forEach(number => {

        const ball =
            document.createElement("div");

        ball.className = "ball";

        ball.innerText = number;

        ball.addEventListener(
            "click",
            function () {

                if (
                    ball.classList.contains("selected")
                ) {

                    ball.classList.remove("selected");

                    selected =
                        selected.filter(
                            n => n !== number
                        );

                } else {

                    if (selected.length >= 6) {

                        alert(
                            "6개까지만 선택할 수 있습니다."
                        );

                        return;
                    }

                    ball.classList.add("selected");

                    selected.push(number);
                }

                updateCount();
            }
        );

        board.appendChild(ball);
    });
}


// ========================================
// 🔢 선택 개수
// ========================================

function updateCount() {

    if (!count) {
        return;
    }

    count.innerText =
        `선택 : ${selected.length} / 6`;
}


// ========================================
// 👩‍🎓 학번 가져오기
// ========================================

function getStudentId() {

    const studentId =
        localStorage.getItem("studentId");

    if (!studentId) {
        return null;
    }

    return String(studentId).trim();
}


// ========================================
// 👩‍🎓 학생 정보 가져오기
// ========================================

async function getStudentInfo() {

    const studentId =
        getStudentId();

    if (!studentId) {

        return {
            data: null,
            error: {
                message:
                    "학번 정보가 없습니다."
            }
        };
    }

    const {
        data,
        error
    } =
        await db
            .from("students")
            .select("student_id, confirmed")
            .eq("student_id", studentId)
            .maybeSingle();

    if (error) {

        console.error(
            "학생 정보 조회 오류:",
            error
        );
    }

    return {
        data,
        error
    };
}


// ========================================
// 🎟️ 내 로또 불러오기
// ========================================

async function getTickets() {

    const studentId =
        getStudentId();

    if (!studentId) {
        return [];
    }

    const {
        data,
        error
    } =
        await db
            .from("tickets")
            .select("*")
            .eq("student_id", studentId)
            .order("id", {
                ascending: true
            });

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

    if (!submitBtn) {
        return;
    }

    const studentId =
        getStudentId();

    // 학번 자체가 없는 경우
    if (!studentId) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "학생 정보 확인 필요";

        showStudentMessage(
            "학번 정보가 없습니다."
        );

        return;
    }


    // 학생 정보 가져오기
    const {
        data: studentData,
        error: studentError
    } =
        await getStudentInfo();


    // 조회 오류
    if (studentError) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "학생 정보 확인 필요";

        showStudentMessage(
            "학생 정보를 불러오지 못했습니다."
        );

        return;
    }


    // 학생 행 자체가 없는 경우
    if (!studentData) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "학생 정보 확인 필요";

        showStudentMessage(
            `${studentId} 학생 정보를 찾을 수 없습니다.`
        );

        return;
    }


    // ====================================
    // ⭐ 관리자 확인 여부
    // ====================================

    if (studentData.confirmed !== true) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "🔒 관리자 확인 대기 중";

        hideStudentMessage();

        return;
    }


    // ====================================
    // 🎟️ 기존 로또 확인
    // ====================================

    const tickets =
        await getTickets();

    if (tickets.length === 0) {

        submitBtn.disabled = false;

        submitBtn.innerText =
            "제출하기";

        hideStudentMessage();

        return;
    }


    const latestTicket =
        tickets[tickets.length - 1];


    // 최근 로또까지 확인됨
    if (
        latestTicket.confirmed === true
    ) {

        submitBtn.disabled = false;

        submitBtn.innerText =
            "제출하기";

        hideStudentMessage();

    } else {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "🔒 관리자 확인 대기 중";
    }
}


// ========================================
// ℹ️ 학생 메시지
// ========================================

function showStudentMessage(message) {

    let box =
        document.getElementById(
            "studentMessage"
        );

    if (!box) {

        box =
            document.createElement("p");

        box.id =
            "studentMessage";

        box.style.marginTop =
            "10px";

        box.style.padding =
            "10px";

        box.style.borderRadius =
            "8px";

        box.style.background =
            "#fff3f3";

        box.style.color =
            "#c62828";

        if (submitBtn) {

            submitBtn.parentNode.appendChild(
                box
            );
        }
    }

    box.innerText =
        message;
}


function hideStudentMessage() {

    const box =
        document.getElementById(
            "studentMessage"
        );

    if (box) {
        box.remove();
    }
}


// ========================================
// 📤 로또 제출
// ========================================

if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        async function () {

            const studentId =
                getStudentId();


            if (!studentId) {

                alert(
                    "학번 정보를 찾을 수 없습니다."
                );

                return;
            }


            // 학생 정보 확인
            const {
                data: studentData,
                error: studentError
            } =
                await getStudentInfo();


            if (studentError) {

                alert(
                    "학생 정보를 확인할 수 없습니다."
                );

                return;
            }


            if (!studentData) {

                alert(
                    `${studentId} 학생 정보를 찾을 수 없습니다.`
                );

                return;
            }


            // 관리자 확인 여부
            if (
                studentData.confirmed !== true
            ) {

                alert(
                    "아직 관리자 확인이 완료되지 않았습니다."
                );

                await checkSubmitStatus();

                return;
            }


            // 번호 6개 확인
            if (
                selected.length !== 6
            ) {

                alert(
                    "번호를 6개 선택해주세요."
                );

                return;
            }


            // 이전 로또 확인
            const tickets =
                await getTickets();


            if (tickets.length > 0) {

                const latestTicket =
                    tickets[
                        tickets.length - 1
                    ];


                if (
                    latestTicket.confirmed !== true
                ) {

                    alert(
                        "아직 이전 로또의 확인이 완료되지 않았습니다.\n\n" +
                        "관리자에게 확인을 요청해주세요."
                    );

                    return;
                }
            }


            // ====================================
            // ☁️ Supabase에 로또 저장
            // ====================================

            const {
                data,
                error
            } =
                await db
                    .from("tickets")
                    .insert({
                        student_id: studentId,
                        numbers: selected,
                        submitted_at:
                            new Date().toISOString(),
                        confirmed: false
                    })
                    .select();


            if (error) {

                console.error(
                    "로또 제출 오류:",
                    error
                );

                alert(
                    "로또 제출에 실패했습니다."
                );

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

                    ball.classList.remove(
                        "selected"
                    );
                });


            updateCount();

            await checkSubmitStatus();

            await showMyResults();
        }
    );
}


// ========================================
// 🏆 결과
// ========================================

async function showMyResults() {

    const resultBox =
        document.getElementById(
            "myResults"
        );

    if (!resultBox) {
        return;
    }

    resultBox.innerHTML = "";

    const studentId =
        getStudentId();

    if (!studentId) {
        return;
    }


    // 추첨 결과
    const {
        data: drawData,
        error: drawError
    } =
        await db
            .from("draw_results")
            .select("*")
            .order("id", {
                ascending: false
            })
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


    // 내 로또
    const tickets =
        await getTickets();


    if (tickets.length === 0) {

        resultBox.innerHTML =
            "<p>아직 제출한 로또가 없습니다.</p>";

        return;
    }


    const title =
        document.createElement("h2");

    title.innerText =
        `🏆 ${drawData.draw_date} 결과`;

    resultBox.appendChild(title);


    const winningNumbers =
        document.createElement("p");

    winningNumbers.innerText =
        `당첨 번호: ${drawData.numbers.join(", ")}`;

    resultBox.appendChild(
        winningNumbers
    );


    tickets.forEach(
        (ticket, index) => {

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
                        drawData.numbers.includes(
                            number
                        )
                ).length;


            const ticketTitle =
                document.createElement("p");

            ticketTitle.innerText =
                `${index + 1}장: ${numbers.join(", ")}`;

            ticketBox.appendChild(
                ticketTitle
            );


            const result =
                document.createElement(
                    "strong"
                );


            if (matchCount === 6) {

                result.innerText =
                    "🎉🎉 6개 당첨!";

            } else if (
                matchCount === 5
            ) {

                result.innerText =
                    "🎉 5개 당첨!";

            } else {

                result.innerText =
                    `${matchCount}개 일치`;
            }


            ticketBox.appendChild(result);

            resultBox.appendChild(
                ticketBox
            );
        }
    );
}


// ========================================
// 🚀 시작
// ========================================

async function initialize() {

    await createLottoBoard();

    await checkSubmitStatus();

    await showMyResults();
}


initialize();
