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
// 🎟️ 로또 지급 수량 가져오기
// ========================================

async function getLottoCredits() {

    const studentId =
        getStudentId();

    if (!studentId) {
        return 0;
    }

    const {
        data,
        error
    } =
        await db
            .from("lotto_credits")
            .select("student_id, credits")
            .eq("student_id", studentId)
            .maybeSingle();

    if (error) {

        console.error(
            "로또 지급 수량 조회 오류:",
            error
        );

        return 0;
    }

    if (!data) {
        return 0;
    }

    return Number(data.credits) || 0;
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
// 🎟️ 로또 제출 가능 장수 계산
// ========================================

async function getLottoStatus() {

    const credits =
        await getLottoCredits();

    const tickets =
        await getTickets();

    const submittedCount =
        tickets.length;

    const remaining =
        Math.max(
            credits - submittedCount,
            0
        );

    return {
        credits,
        submittedCount,
        remaining
    };
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

        showStudentMessage(
            "관리자의 학생 확인이 완료되면 로또를 제출할 수 있습니다."
        );

        return;
    }


    // ====================================
    // 🎟️ 로또 지급/제출 상태
    // ====================================

    const {
        credits,
        submittedCount,
        remaining
    } =
        await getLottoStatus();


    // 지급받은 로또가 없는 경우
    if (credits <= 0) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "🎟️ 로또 지급 대기 중";

        showStudentMessage(
            "관리자에게 로또를 지급받은 후 제출할 수 있습니다."
        );

        return;
    }


    // ====================================
    // 🎟️ 남은 로또가 있는 경우
    // ====================================

    if (remaining > 0) {

        submitBtn.disabled = false;

        submitBtn.innerText =
            "제출하기";

        showStudentMessage(
            `🎟️ 지급 ${credits}장 · 제출 ${submittedCount}장 · 남은 ${remaining}장`
        );

        return;
    }


    // ====================================
    // 🎟️ 지급받은 만큼 모두 제출한 경우
    // ====================================

    submitBtn.disabled = true;

    submitBtn.innerText =
        "🎟️ 제출 완료";

    showStudentMessage(
        `🎟️ 지급 ${credits}장 · 제출 ${submittedCount}장\n모든 로또를 제출했습니다.`
    );
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


            // ====================================
            // 🎟️ 지급된 로또 장수 확인
            // ====================================

            const {
                credits,
                submittedCount,
                remaining
            } =
                await getLottoStatus();


            if (credits <= 0) {

                alert(
                    "아직 지급받은 로또가 없습니다.\n\n" +
                    "관리자에게 로또 지급을 요청해주세요."
                );

                await checkSubmitStatus();

                return;
            }


            if (remaining <= 0) {

                alert(
                    "지급받은 로또를 모두 제출했습니다."
                );

                await checkSubmitStatus();

                return;
            }


            // ====================================
            // 번호 6개 확인
            // ====================================

            if (
                selected.length !== 6
            ) {

                alert(
                    "번호를 6개 선택해주세요."
                );

                return;
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
                "관리자에게 제출한 로또 확인을 요청해주세요."
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


            // 제출 후 상태 다시 확인
            await checkSubmitStatus();

            await showMyResults();

            await showAllResults();
        }
    );
}


// ========================================
// 🏆 내 결과
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
// 🏆 전체 학생 결과
// ========================================

async function showAllResults() {

    // 결과를 넣을 공간 찾기
    let allResults =
        document.getElementById(
            "allResults"
        );


    // 없으면 자동으로 생성
    if (!allResults) {

        allResults =
            document.createElement("div");

        allResults.id =
            "allResults";

        allResults.style.marginTop =
            "30px";

        allResults.style.paddingTop =
            "25px";

        allResults.style.borderTop =
            "2px solid #eee";


        const myResults =
            document.getElementById(
                "myResults"
            );


        if (myResults) {

            myResults.parentNode.appendChild(
                allResults
            );

        } else if (board) {

            board.parentNode.appendChild(
                allResults
            );

        } else {

            document.body.appendChild(
                allResults
            );
        }
    }


    allResults.innerHTML = "";


    // ====================================
    // 추첨 결과 가져오기
    // ====================================

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
            "전체 결과 추첨 조회 오류:",
            drawError
        );

        allResults.innerHTML =
            "<p>전체 결과를 불러오지 못했습니다.</p>";

        return;
    }


    if (!drawData) {

        allResults.innerHTML =
            "<h2>🏆 전체 학생 결과</h2>" +
            "<p>아직 추첨 결과가 없습니다.</p>";

        return;
    }


    // ====================================
    // 학생 전체 가져오기
    // ====================================

    const {
        data: students,
        error: studentError
    } =
        await db
            .from("students")
            .select("student_id")
            .order("student_id", {
                ascending: true
            });


    if (studentError) {

        console.error(
            "전체 학생 조회 오류:",
            studentError
        );

        allResults.innerHTML =
            "<p>학생 정보를 불러오지 못했습니다.</p>";

        return;
    }


    // ====================================
    // 로또 전체 가져오기
    // ====================================

    const {
        data: allTickets,
        error: ticketError
    } =
        await db
            .from("tickets")
            .select(
                "id, student_id, numbers"
            )
            .order("id", {
                ascending: true
            });


    if (ticketError) {

        console.error(
            "전체 로또 조회 오류:",
            ticketError
        );

        allResults.innerHTML =
            "<p>전체 로또 결과를 불러오지 못했습니다.</p>";

        return;
    }


    const winningNumbers =
        Array.isArray(drawData.numbers)
            ? drawData.numbers
            : [];


    // ====================================
    // 학생별 결과 계산
    // ====================================

    const resultList =
        students.map(student => {

            const studentId =
                String(
                    student.student_id
                ).trim();


            const tickets =
                (allTickets || []).filter(
                    ticket =>
                        String(
                            ticket.student_id
                        ).trim() === studentId
                );


            const details =
                tickets.map(
                    (ticket, index) => {

                        const numbers =
                            Array.isArray(
                                ticket.numbers
                            )
                                ? ticket.numbers
                                : [];


                        const matchCount =
                            numbers.filter(
                                number =>
                                    winningNumbers.includes(
                                        number
                                    )
                            ).length;


                        return {
                            ticketNumber:
                                index + 1,

                            matchCount:
                                matchCount,

                            numbers:
                                numbers
                        };
                    }
                );


            const best =
                details.length > 0
                    ? Math.max(
                        ...details.map(
                            item =>
                                item.matchCount
                        )
                    )
                    : null;


            return {
                studentId:
                    studentId,

                details:
                    details,

                best:
                    best
            };
        });


    // ====================================
    // 제목
    // ====================================

    const title =
        document.createElement("h2");

    title.innerText =
        "🏆 전체 학생 결과";

    allResults.appendChild(
        title
    );


    const subtitle =
        document.createElement("p");

    subtitle.innerText =
        `${drawData.draw_date} · 최고 적중 개수`;

    subtitle.style.color =
        "#666";

    subtitle.style.marginBottom =
        "15px";

    allResults.appendChild(
        subtitle
    );


    // ====================================
    // 🔘 정렬 버튼
    // ====================================

    const sortBox =
        document.createElement("div");

    sortBox.style.display =
        "flex";

    sortBox.style.gap =
        "8px";

    sortBox.style.marginBottom =
        "15px";


    const studentSortBtn =
        document.createElement("button");

    studentSortBtn.innerText =
        "학번순";

    const rankSortBtn =
        document.createElement("button");

    rankSortBtn.innerText =
        "등수순";


    [studentSortBtn, rankSortBtn]
        .forEach(button => {

            button.style.flex =
                "1";

            button.style.padding =
                "10px";

            button.style.border =
                "none";

            button.style.borderRadius =
                "8px";

            button.style.cursor =
                "pointer";

            button.style.fontSize =
                "14px";

            button.style.fontWeight =
                "bold";

            button.style.background =
                "#e9f7e9";

            button.style.color =
                "#3d7c3d";
        });


    sortBox.appendChild(
        studentSortBtn
    );

    sortBox.appendChild(
        rankSortBtn
    );

    allResults.appendChild(
        sortBox
    );


    // ====================================
    // 📋 결과 표시 공간
    // ====================================

    const listBox =
        document.createElement("div");

    allResults.appendChild(
        listBox
    );


    // ====================================
    // 결과 그리기 함수
    // ====================================

    function renderResults(mode) {

        listBox.innerHTML = "";


        let sorted =
            [...resultList];


        // --------------------------------
        // 학번순
        // --------------------------------

        if (mode === "student") {

            sorted.sort(
                (a, b) =>
                    a.studentId.localeCompare(
                        b.studentId
                    )
            );
        }


        // --------------------------------
        // 등수순
        // --------------------------------

        if (mode === "rank") {

            sorted.sort(
                (a, b) => {

                    // 제출한 학생 먼저
                    if (
                        a.best === null &&
                        b.best !== null
                    ) {
                        return 1;
                    }

                    if (
                        a.best !== null &&
                        b.best === null
                    ) {
                        return -1;
                    }

                    // 최고 개수 높은 순
                    if (
                        a.best !== b.best
                    ) {

                        return (
                            (b.best ?? -1) -
                            (a.best ?? -1)
                        );
                    }

                    // 같은 점수면 학번순
                    return a.studentId.localeCompare(
                        b.studentId
                    );
                }
            );
        }


        // =================================
        // 순위 계산
        // =================================

        let currentRank = 0;

        let previousBest = null;

        let countedStudents = 0;


        sorted.forEach(
            student => {

                let rankText = "";


                if (
                    mode === "rank" &&
                    student.best !== null
                ) {

                    countedStudents++;


                    if (
                        previousBest !==
                        student.best
                    ) {

                        currentRank =
                            countedStudents;

                        previousBest =
                            student.best;
                    }


                    if (
                        currentRank === 1
                    ) {

                        rankText =
                            "🥇";

                    } else if (
                        currentRank === 2
                    ) {

                        rankText =
                            "🥈";

                    } else if (
                        currentRank === 3
                    ) {

                        rankText =
                            "🥉";

                    } else {

                        rankText =
                            `${currentRank}위`;
                    }
                }


                // =================================
                // 접기/펼치기
                // =================================

                const details =
                    document.createElement(
                        "details"
                    );


                details.style.marginBottom =
                    "8px";


                const summary =
                    document.createElement(
                        "summary"
                    );


                summary.style.cursor =
                    "pointer";

                summary.style.padding =
                    "12px";

                summary.style.borderRadius =
                    "10px";

                summary.style.background =
                    "#f5f5f5";

                summary.style.fontWeight =
                    "bold";

                summary.style.listStylePosition =
                    "inside";


                if (
                    mode === "rank" &&
                    student.best !== null
                ) {

                    summary.innerText =
                        `${rankText}  ${student.studentId}  ·  🏆 ${student.best}개`;

                } else if (
                    student.best !== null
                ) {

                    summary.innerText =
                        `${student.studentId}  ·  🏆 ${student.best}개`;

                } else {

                    summary.innerText =
                        `${student.studentId}  ·  제출 없음`;
                }


                details.appendChild(
                    summary
                );


                // =================================
                // 상세 내용
                // =================================

                const detailBox =
                    document.createElement(
                        "div"
                    );


                detailBox.style.padding =
                    "10px 15px";

                detailBox.style.background =
                    "#fafafa";

                detailBox.style.borderRadius =
                    "0 0 10px 10px";


                if (
                    student.details.length === 0
                ) {

                    detailBox.innerText =
                        "아직 제출한 로또가 없습니다.";

                } else {

                    student.details.forEach(
                        detail => {

                            const row =
                                document.createElement(
                                    "div"
                                );


                            row.style.padding =
                                "7px 0";

                            row.style.borderBottom =
                                "1px solid #eee";


                            row.innerText =
                                `${detail.ticketNumber}장 · ${detail.matchCount}개 일치`;


                            detailBox.appendChild(
                                row
                            );
                        }
                    );
                }


                details.appendChild(
                    detailBox
                );

                listBox.appendChild(
                    details
                );
            }
        );
    }


    // ====================================
    // 버튼 기능
    // ====================================

    studentSortBtn.addEventListener(
        "click",
        function () {

            renderResults(
                "student"
            );

            studentSortBtn.style.background =
                "#4caf50";

            studentSortBtn.style.color =
                "white";

            rankSortBtn.style.background =
                "#e9f7e9";

            rankSortBtn.style.color =
                "#3d7c3d";
        }
    );


    rankSortBtn.addEventListener(
        "click",
        function () {

            renderResults(
                "rank"
            );

            rankSortBtn.style.background =
                "#4caf50";

            rankSortBtn.style.color =
                "white";

            studentSortBtn.style.background =
                "#e9f7e9";

            studentSortBtn.style.color =
                "#3d7c3d";
        }
    );


    // ====================================
    // 기본값: 학번순
    // ====================================

    studentSortBtn.style.background =
        "#4caf50";

    studentSortBtn.style.color =
        "white";


    renderResults(
        "student"
    );
}


// ========================================
// 🚀 시작
// ========================================

async function initialize() {

    await createLottoBoard();

    await checkSubmitStatus();

    await showMyResults();

    await showAllResults();
}


initialize();
