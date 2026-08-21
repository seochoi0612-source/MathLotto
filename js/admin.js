const studentList = document.getElementById("studentList");

const db = supabaseClient;


// ========================================
// 🔢 기본 번호
// ========================================

const DEFAULT_NUMBERS =
    Array.from(
        { length: 17 },
        (_, i) => i + 1
    );


// ========================================
// 👩‍🎓 학생 전체 데이터 가져오기
// ========================================

async function getAllStudents() {

    const { data, error } =
        await db
            .from("students")
            .select("*");

    if (error) {

        console.error(
            "학생 데이터 불러오기 오류:",
            error
        );

        return [];
    }

    return data || [];
}


// ========================================
// 🎟️ 학생 로또 지급 정보 가져오기
// ========================================

async function getLottoCredit(studentId) {

    const { data, error } =
        await db
            .from("lotto_credits")
            .select("student_id, credits")
            .eq("student_id", studentId)
            .maybeSingle();

    if (error) {

        console.error(
            `${studentId} 로또 지급 정보 오류:`,
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
// 🎟️ 로또 지급 +1
// ========================================

async function addLottoCredit(studentId) {

    const currentCredits =
        await getLottoCredit(studentId);

    const newCredits =
        currentCredits + 1;


    const { data: existingData, error: findError } =
        await db
            .from("lotto_credits")
            .select("student_id")
            .eq("student_id", studentId)
            .maybeSingle();


    if (findError) {

        console.error(
            "로또 지급 정보 확인 오류:",
            findError
        );

        return false;
    }


    // 이미 있으면 +1
    if (existingData) {

        const { error } =
            await db
                .from("lotto_credits")
                .update({
                    credits: newCredits
                })
                .eq(
                    "student_id",
                    studentId
                );

        if (error) {

            console.error(
                "로또 지급 수량 업데이트 오류:",
                error
            );

            return false;
        }

    }

    // 없으면 새로 생성
    else {

        const { error } =
            await db
                .from("lotto_credits")
                .insert({
                    student_id: studentId,
                    credits: 1
                });

        if (error) {

            console.error(
                "로또 지급 정보 생성 오류:",
                error
            );

            return false;
        }
    }


    return true;
}


// ========================================
// 👩‍🎓 학생 목록
// ========================================

async function loadStudents() {

    studentList.innerHTML = "";

    const studentsData =
        await getAllStudents();


    for (let i = 1; i <= 19; i++) {

        const studentId =
            "26" + String(i).padStart(2, "0");


        const studentData =
            studentsData.find(
                student =>
                    String(student.student_id) === studentId
            );


        // ====================================
        // 학생 박스
        // ====================================

        const student =
            document.createElement("div");

        student.className =
            "student";


        // 학번
        const idText =
            document.createElement("span");

        idText.className =
            "student-id";

        idText.innerText =
            studentId;


        // 상태
        const status =
            document.createElement("span");

        status.className =
            "status";


        // 버튼
        const button =
            document.createElement("button");

        button.className =
            "confirm-btn";

        button.innerText =
            "확인";


        // ====================================
        // 학생 데이터가 없는 경우
        // ====================================

        if (!studentData) {

            status.innerText =
                "학생 정보 확인 필요";

            status.className =
                "status not-confirmed";

        } else {

            await updateStudentStatus(
                student,
                status,
                button,
                studentId
            );
        }


        // ====================================
        // 확인 버튼
        // ====================================

        button.addEventListener(
            "click",
            async function () {

                await confirmStudent(
                    student,
                    status,
                    button,
                    studentId
                );

            }
        );


        student.appendChild(idText);
        student.appendChild(status);
        student.appendChild(button);

        studentList.appendChild(student);
    }
}


// ========================================
// 👩‍🎓 학생 상태 업데이트
// ========================================

async function updateStudentStatus(
    student,
    status,
    button,
    studentId
) {

    // ====================================
    // 학생 정보
    // ====================================

    const {
        data: studentData,
        error: studentError
    } =
        await db
            .from("students")
            .select("student_id, confirmed")
            .eq("student_id", studentId)
            .maybeSingle();


    if (studentError) {

        console.error(
            `${studentId} 학생 상태 오류:`,
            studentError
        );

        status.innerText =
            "조회 오류";

        return;
    }


    const confirmed =
        studentData &&
        studentData.confirmed === true;


    // ====================================
    // 최근 로또
    // ====================================

    const {
        data: latestTicket,
        error: ticketError
    } =
        await db
            .from("tickets")
            .select(
                "id, numbers, submitted_at, confirmed"
            )
            .eq("student_id", studentId)
            .order("id", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();


    if (ticketError) {

        console.error(
            `${studentId} 로또 불러오기 오류:`,
            ticketError
        );
    }


    // ====================================
    // 기존 표시 제거
    // ====================================

    const oldTickets =
        student.querySelector(".tickets");

    if (oldTickets) {
        oldTickets.remove();
    }


    // ====================================
    // 학생 인증 상태
    // ====================================

    if (confirmed) {

        status.innerText =
            "✅ 확인됨";

        status.className =
            "status confirmed";

    } else {

        status.innerText =
            "미확인";

        status.className =
            "status not-confirmed";
    }


    // ====================================
    // 🎟️ 로또 지급 수량
    // ====================================

    const credits =
        await getLottoCredit(studentId);


    // ====================================
    // 🎟️ 제출한 로또 수
    // ====================================

    const {
        data: allTickets,
        error: allTicketError
    } =
        await db
            .from("tickets")
            .select("id")
            .eq("student_id", studentId);


    if (allTicketError) {

        console.error(
            `${studentId} 로또 개수 조회 오류:`,
            allTicketError
        );
    }


    const submittedCount =
        allTickets
            ? allTickets.length
            : 0;


    // ====================================
    // 🎟️ 지급/제출 상태 표시
    // ====================================

    const creditBox =
        document.createElement("div");

    creditBox.className =
        "tickets";

    creditBox.style.marginTop =
        "8px";


    creditBox.innerText =
        `🎟️ 지급 ${credits}장 · 제출 ${submittedCount}장 · 남은 ${credits - submittedCount < 0 ? 0 : credits - submittedCount}장`;


    student.appendChild(
        creditBox
    );


    // ====================================
    // 최근 로또 표시
    // ====================================

    if (latestTicket) {

        const ticketsBox =
            document.createElement("div");

        ticketsBox.className =
            "tickets";


        const title =
            document.createElement("div");

        title.className =
            "tickets-title";

        title.innerText =
            "🔴 최근 로또 제출";

        ticketsBox.appendChild(title);


        const ticketText =
            document.createElement("div");

        ticketText.className =
            "ticket";


        if (
            Array.isArray(
                latestTicket.numbers
            )
        ) {

            ticketText.innerText =
                latestTicket.numbers.join(", ");

        } else {

            ticketText.innerText =
                latestTicket.numbers;
        }


        ticketsBox.appendChild(
            ticketText
        );


        const ticketStatus =
            document.createElement("div");

        ticketStatus.className =
            "ticket-status";


        if (
            latestTicket.confirmed === true
        ) {

            ticketStatus.innerText =
                "✅ 로또 확인 완료";

        } else {

            ticketStatus.innerText =
                "⏳ 로또 확인 대기";
        }


        ticketsBox.appendChild(
            ticketStatus
        );


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


    // ====================================
    // 버튼 상태
    // ====================================

    if (!studentData) {

        button.innerText =
            "확인";

    } else if (!confirmed) {

        button.innerText =
            "확인";

    } else {

        button.innerText =
            "🎟️ 로또 지급";
    }


    button.disabled = false;
}


// ========================================
// ✅ 확인 / 로또 지급 버튼
// ========================================

async function confirmStudent(
    student,
    status,
    button,
    studentId
) {

    // ====================================
    // 학생 상태 가져오기
    // ====================================

    const {
        data: studentData,
        error: studentError
    } =
        await db
            .from("students")
            .select(
                "student_id, confirmed"
            )
            .eq("student_id", studentId)
            .maybeSingle();


    if (studentError) {

        console.error(
            "학생 상태 확인 오류:",
            studentError
        );

        alert(
            "학생 정보를 불러오지 못했습니다."
        );

        return;
    }


    if (!studentData) {

        alert(
            `${studentId} 학생 정보를 찾을 수 없습니다.`
        );

        return;
    }


    const confirmed =
        studentData.confirmed === true;


    // ====================================
    // 🎟️ 이미 확인된 학생
    // → 로또 1장 추가 지급
    // ====================================

    if (confirmed) {

        const success =
            await addLottoCredit(
                studentId
            );


        if (!success) {

            alert(
                "로또 지급에 실패했습니다."
            );

            return;
        }


        const credits =
            await getLottoCredit(
                studentId
            );


        alert(
            `${studentId} 학생에게 로또 1장을 지급했습니다!\n\n` +
            `현재 지급된 로또: ${credits}장`
        );


        await updateStudentStatus(
            student,
            status,
            button,
            studentId
        );

        return;
    }


    // ====================================
    // ⭐ 학생 최초 확인
    // ====================================

    const {
        error: updateError
    } =
        await db
            .from("students")
            .update({
                confirmed: true
            })
            .eq(
                "student_id",
                studentId
            );


    if (updateError) {

        console.error(
            "학생 인증 저장 오류:",
            updateError
        );

        alert(
            "학생 인증 저장에 실패했습니다."
        );

        return;
    }


    // ====================================
    // 🎟️ 최초 확인도 로또 1장 지급
    // ====================================

    const success =
        await addLottoCredit(
            studentId
        );


    if (!success) {

        alert(
            "학생 인증은 완료되었지만 로또 지급에 실패했습니다."
        );

        await updateStudentStatus(
            student,
            status,
            button,
            studentId
        );

        return;
    }


    // ====================================
    // 기존 미확인 로또가 있다면 확인
    // ====================================

    const {
        data: latestTicket
    } =
        await db
            .from("tickets")
            .select(
                "id, confirmed"
            )
            .eq(
                "student_id",
                studentId
            )
            .order("id", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();


    if (
        latestTicket &&
        latestTicket.confirmed !== true
    ) {

        await db
            .from("tickets")
            .update({
                confirmed: true
            })
            .eq(
                "id",
                latestTicket.id
            );
    }


    alert(
        `${studentId} 학생이 확인되었습니다!\n\n` +
        "🎟️ 로또 1장을 지급했습니다."
    );


    await updateStudentStatus(
        student,
        status,
        button,
        studentId
    );
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


async function getLottoNumbers() {

    const {
        data,
        error
    } =
        await db
            .from("settings")
            .select(
                "id, numbers"
            )
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


async function loadNumberSettings() {

    const numbers =
        await getLottoNumbers();


    if (numberInput) {

        numberInput.value =
            numbers.join(",");
    }


    if (numberStatus) {

        numberStatus.innerText =
            `현재 번호: ${numbers.join(", ")}`;
    }
}


if (saveNumbersBtn) {

    saveNumbersBtn.addEventListener(
        "click",
        async function () {

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
                    .map(
                        number =>
                            number.trim()
                    )
                    .filter(
                        number =>
                            number !== ""
                    )
                    .map(
                        number =>
                            Number(number)
                    );


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


            const uniqueNumbers =
                [...new Set(numbers)];


            if (
                uniqueNumbers.length !==
                numbers.length
            ) {

                alert(
                    "같은 번호를 중복해서 입력할 수 없습니다."
                );

                return;
            }


            if (numbers.length < 6) {

                alert(
                    "번호는 최소 6개 이상 입력해주세요."
                );

                return;
            }


            const {
                data: settingData,
                error: settingError
            } =
                await db
                    .from("settings")
                    .select("id")
                    .order("id", {
                        ascending: true
                    })
                    .limit(1)
                    .maybeSingle();


            if (
                settingError ||
                !settingData
            ) {

                alert(
                    "번호 설정을 찾을 수 없습니다."
                );

                return;
            }


            const {
                error: updateError
            } =
                await db
                    .from("settings")
                    .update({
                        numbers: numbers
                    })
                    .eq(
                        "id",
                        settingData.id
                    );


            if (updateError) {

                console.error(
                    "번호 저장 오류:",
                    updateError
                );

                alert(
                    "번호 저장에 실패했습니다."
                );

                return;
            }


            alert(
                "번호가 저장되었습니다!"
            );


            await loadNumberSettings();
        }
    );
}


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


function showDrawResult(drawData) {

    if (
        !drawInfo ||
        !drawResult
    ) {
        return;
    }


    drawInfo.innerText =
        `🎉 ${drawData.draw_date} 추첨 결과`;


    drawResult.innerHTML = "";


    drawData.numbers.forEach(
        number => {

            const ball =
                document.createElement("span");

            ball.className =
                "draw-number";

            ball.innerText =
                number;

            drawResult.appendChild(
                ball
            );
        }
    );
}


async function loadDrawResult() {

    const {
        data,
        error
    } =
        await db
            .from("draw_results")
            .select("*")
            .order("id", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "추첨 결과 불러오기 오류:",
            error
        );

        return;
    }


    if (!data) {
        return;
    }


    showDrawResult(data);
}


if (drawBtn) {

    drawBtn.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "정말 추첨하시겠습니까?\n\n" +
                    "추첨을 진행하면 새로운 당첨 번호가 결정됩니다."
                );


            if (!confirmed) {
                return;
            }


            const availableNumbers =
                await getLottoNumbers();


            if (
                availableNumbers.length < 6
            ) {

                alert(
                    "추첨하려면 최소 6개의 번호가 필요합니다."
                );

                return;
            }


            const numbers = [];


            while (
                numbers.length < 6
            ) {

                const randomIndex =
                    Math.floor(
                        Math.random() *
                        availableNumbers.length
                    );


                const number =
                    availableNumbers[
                        randomIndex
                    ];


                if (
                    !numbers.includes(number)
                ) {

                    numbers.push(number);
                }
            }


            numbers.sort(
                (a, b) => a - b
            );


            const today =
                new Date();


            const dateText =
                `${today.getFullYear()}년 ` +
                `${today.getMonth() + 1}월 ` +
                `${today.getDate()}일`;


            const {
                data,
                error
            } =
                await db
                    .from("draw_results")
                    .insert({
                        numbers: numbers,
                        draw_date: dateText
                    })
                    .select()
                    .single();


            if (error) {

                console.error(
                    "추첨 결과 저장 오류:",
                    error
                );

                alert(
                    "추첨 결과 저장에 실패했습니다."
                );

                return;
            }


            showDrawResult(data);


            alert(
                "🎉 추첨이 완료되었습니다!\n\n" +
                `당첨 번호: ${numbers.join(", ")}`
            );
        }
    );
}


loadDrawResult();


// ========================================
// ⚙️ 전체 데이터 초기화
// ========================================

const resetAllBtn =
    document.getElementById(
        "resetAllBtn"
    );


if (resetAllBtn) {

    resetAllBtn.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "⚠️ 정말 전체 데이터를 초기화하시겠습니까?\n\n" +
                    "학생 확인 상태, 제출 번호,\n" +
                    "추첨 결과, 번호 설정이 모두 초기화됩니다."
                );


            if (!confirmed) {
                return;
            }


            const {
                error: studentResetError
            } =
                await db
                    .from("students")
                    .update({
                        confirmed: false
                    })
                    .neq(
                        "student_id",
                        ""
                    );


            if (studentResetError) {

                alert(
                    "학생 인증 상태 초기화에 실패했습니다."
                );

                return;
            }


            // tickets 삭제
            const {
                error: ticketResetError
            } =
                await db
                    .from("tickets")
                    .delete()
                    .neq(
                        "id",
                        0
                    );


            if (ticketResetError) {

                alert(
                    "로또 데이터 초기화에 실패했습니다."
                );

                return;
            }


            // 🎟️ 로또 지급 정보 초기화
            const {
                error: creditResetError
            } =
                await db
                    .from("lotto_credits")
                    .update({
                        credits: 0
                    })
                    .neq(
                        "student_id",
                        ""
                    );


            if (creditResetError) {

                console.error(
                    "로또 지급 정보 초기화 오류:",
                    creditResetError
                );

                alert(
                    "로또 지급 정보 초기화에 실패했습니다."
                );

                return;
            }


            // settings 초기화
            const {
                data: settingData
            } =
                await db
                    .from("settings")
                    .select("id")
                    .order("id", {
                        ascending: true
                    })
                    .limit(1)
                    .maybeSingle();


            if (settingData) {

                await db
                    .from("settings")
                    .update({
                        numbers:
                            DEFAULT_NUMBERS
                    })
                    .eq(
                        "id",
                        settingData.id
                    );
            }


            // draw_results 삭제
            const {
                error: drawResetError
            } =
                await db
                    .from("draw_results")
                    .delete()
                    .neq(
                        "id",
                        0
                    );


            if (drawResetError) {

                alert(
                    "추첨 결과 초기화에 실패했습니다."
                );

                return;
            }


            localStorage.removeItem(
                "lottoNumbers"
            );

            localStorage.removeItem(
                "drawResult"
            );

            localStorage.removeItem(
                "studentId"
            );


            for (
                let i = 1;
                i <= 19;
                i++
            ) {

                const studentId =
                    "26" +
                    String(i).padStart(
                        2,
                        "0"
                    );


                localStorage.removeItem(
                    "confirmed_" +
                    studentId
                );

                localStorage.removeItem(
                    "submitted_" +
                    studentId
                );
            }


            alert(
                "✅ 전체 데이터가 초기화되었습니다."
            );


            location.reload();
        }
    );
}


// ========================================
// 🧪 Supabase 연결 확인
// ========================================

async function testSupabase() {

    const {
        data,
        error
    } =
        await db
            .from("students")
            .select("*");


    if (error) {

        console.error(
            "Supabase 연결 오류:",
            error
        );

        return;
    }


    console.log(
        "Supabase 학생 데이터:",
        data
    );
}


testSupabase();


// ========================================
// 🚀 시작
// ========================================

loadStudents();
