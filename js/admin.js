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

    console.log(
        "Supabase 학생 데이터:",
        data
    );

    return data || [];
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


        // ====================================
        // DB에서 학생 찾기
        // ====================================

        const studentData =
            studentsData.find(
                student =>
                    String(student.student_id) === studentId
            );


        console.log(
            `${studentId} 학생 검색 결과:`,
            studentData
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

            /*
             * 중요:
             * 버튼을 disabled 하지 않는다.
             * 2602 / 2603 때문에 버튼 자체가
             * 회색으로 잠기는 문제를 방지한다.
             */

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

    const { data: studentData, error: studentError } =
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

    const { data: latestTicket, error: ticketError } =
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


    // 기존 티켓 표시 제거
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


        if (Array.isArray(latestTicket.numbers)) {

            ticketText.innerText =
                latestTicket.numbers.join(", ");

        } else {

            ticketText.innerText =
                latestTicket.numbers;
        }


        ticketsBox.appendChild(ticketText);


        // 로또 확인 상태
        const ticketStatus =
            document.createElement("div");

        ticketStatus.className =
            "ticket-status";


        if (latestTicket.confirmed === true) {

            ticketStatus.innerText =
                "✅ 로또 확인 완료";

        } else {

            ticketStatus.innerText =
                "⏳ 로또 확인 대기";
        }


        ticketsBox.appendChild(ticketStatus);


        student.appendChild(ticketsBox);

    } else {

        const noTicket =
            document.createElement("div");

        noTicket.className =
            "tickets no-ticket";

        noTicket.innerText =
            "⚪ 로또 미제출";

        student.appendChild(noTicket);
    }


    // ====================================
    // 버튼 상태
    // ====================================

    if (!latestTicket) {

        button.innerText =
            "확인";

    } else if (latestTicket.confirmed === true) {

        button.innerText =
            "확인 완료";

    } else {

        button.innerText =
            "로또 확인";
    }


    // 혹시 disabled 상태가 남아 있다면 해제
    button.disabled = false;
}


// ========================================
// ✅ 확인 버튼
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

    const { data: studentData, error: studentError } =
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


    // ====================================
    // 학생 정보 없음
    // ====================================

    if (!studentData) {

        alert(
            `${studentId} 학생 정보를 찾을 수 없습니다.`
        );

        return;
    }


    const confirmed =
        studentData.confirmed === true;


    // ====================================
    // 최근 로또 가져오기
    // ====================================

    const { data: latestTicket, error: ticketError } =
        await db
            .from("tickets")
            .select(
                "id, confirmed"
            )
            .eq("student_id", studentId)
            .order("id", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();


    if (ticketError) {

        console.error(
            "최근 로또 확인 오류:",
            ticketError
        );

        alert(
            "학생의 로또 정보를 불러오지 못했습니다."
        );

        return;
    }


    // ====================================
    // ① 학생 미확인
    // ====================================

    if (!confirmed) {

        const { data: updatedStudent, error: updateError } =
            await db
                .from("students")
                .update({
                    confirmed: true
                })
                .eq("student_id", studentId)
                .select();


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


        console.log(
            `${studentId} 학생 인증 저장 결과:`,
            updatedStudent
        );


        // 이미 제출된 로또가 있다면
        // 최근 로또도 확인 처리
        if (latestTicket) {

            const { error: ticketConfirmError } =
                await db
                    .from("tickets")
                    .update({
                        confirmed: true
                    })
                    .eq(
                        "id",
                        latestTicket.id
                    );


            if (ticketConfirmError) {

                console.error(
                    "로또 확인 저장 오류:",
                    ticketConfirmError
                );
            }
        }


        alert(
            `${studentId} 학생이 확인되었습니다.\n\n` +
            "이제 로또를 제출할 수 있습니다."
        );
    }


    // ====================================
    // ② 학생 확인됨 + 로또 없음
    // ====================================

    else if (!latestTicket) {

        alert(
            `${studentId} 학생은 이미 확인되었습니다.\n\n` +
            "아직 제출한 로또가 없습니다."
        );
    }


    // ====================================
    // ③ 로또 미확인
    // ====================================

    else if (
        latestTicket.confirmed !== true
    ) {

        const { error: confirmError } =
            await db
                .from("tickets")
                .update({
                    confirmed: true
                })
                .eq(
                    "id",
                    latestTicket.id
                );


        if (confirmError) {

            console.error(
                "로또 확인 오류:",
                confirmError
            );

            alert(
                "로또 확인에 실패했습니다."
            );

            return;
        }


        alert(
            `${studentId} 학생의 로또가 확인되었습니다.\n\n` +
            "이제 다음 로또를 제출할 수 있습니다."
        );
    }


    // ====================================
    // ④ 이미 확인됨
    // ====================================

    else {

        alert(
            `${studentId} 학생의 최근 로또는 이미 확인되었습니다.`
        );
    }


    // 화면 업데이트
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


// ========================================
// 번호 가져오기
// ========================================

async function getLottoNumbers() {

    const { data, error } =
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


// ========================================
// 현재 번호 표시
// ========================================

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


// ========================================
// 번호 저장
// ========================================

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

                console.error(
                    "번호 설정 찾기 오류:",
                    settingError
                );

                alert(
                    "번호 설정을 찾을 수 없습니다."
                );

                return;
            }


            const { error: updateError } =
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


// ========================================
// 추첨 결과 표시
// ========================================

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


// ========================================
// 기존 추첨 결과 불러오기
// ========================================

async function loadDrawResult() {

    const { data, error } =
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


// ========================================
// 추첨하기
// ========================================

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


            const year =
                today.getFullYear();

            const month =
                today.getMonth() + 1;

            const date =
                today.getDate();


            const dateText =
                `${year}년 ${month}월 ${date}일`;


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


            // 학생 확인 초기화
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

                console.error(
                    "학생 인증 초기화 오류:",
                    studentResetError
                );

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

                console.error(
                    "로또 데이터 초기화 오류:",
                    ticketResetError
                );

                alert(
                    "로또 데이터 초기화에 실패했습니다."
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

                const {
                    error: settingsResetError
                } =
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


                if (settingsResetError) {

                    console.error(
                        "번호 설정 초기화 오류:",
                        settingsResetError
                    );

                    alert(
                        "번호 설정 초기화에 실패했습니다."
                    );

                    return;
                }
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

                console.error(
                    "추첨 결과 초기화 오류:",
                    drawResetError
                );

                alert(
                    "추첨 결과 초기화에 실패했습니다."
                );

                return;
            }


            // localStorage 정리
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
