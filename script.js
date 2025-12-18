/* ====================================
   JavaScript: ゲームロジック
==================================== */
// --- 設定値 ---
const NORMAL_MODE_TURNS = 5; // 通常モードの規定回数

// --- グローバル変数 ---
let gameMode = 'normal';
let currentLife = 0;
let initialLife = 0; // リトライ計算用
let turnCount = 0;
let completedTurns = 0;
let targetTime = 0;
let startTime = 0;
let isRunning = false;
let highScore = 0; // エンドレスモードのハイスコア

// --- DOM要素 ---
const screens = {
    title: document.getElementById('title-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    life: document.getElementById('life-display'),
    mode: document.getElementById('mode-display'),
    turn: document.getElementById('turn-display'),
    highScoreDisplay: document.getElementById('highscore-display'),
    titleHighScore: document.getElementById('title-high-score'),
    target: document.getElementById('target-time'),
    timer: document.getElementById('timer'),
    btn: document.getElementById('action-btn'),
    turnResult: document.getElementById('turn-result'),
    diffVal: document.getElementById('diff-value'),
    lostVal: document.getElementById('lost-value'),
    resultTitle: document.getElementById('result-title'),
    resultMsg: document.getElementById('result-message'),
    finalScore: document.getElementById('final-score'),
    newRecordMsg: document.getElementById('new-record-msg')
};

// --- 初期化処理 ---
// ページ読み込み時にハイスコアを取得
window.onload = () => {
    const savedScore = localStorage.getItem('jts_highscore');
    if (savedScore) {
        highScore = parseInt(savedScore, 10);
    }
    ui.titleHighScore.textContent = highScore;
};

/**
 * 画面切り替え
 */
function showScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

/**
 * ゲーム開始
 * @param {string} mode 'normal' or 'endless'
 * @param {number} startLife 初期ライフ (秒)
 */
function startGame(mode, startLife) {
    gameMode = mode;
    initialLife = startLife;
    currentLife = startLife;
    turnCount = 1;
    completedTurns = 0;
    
    // 表示のセットアップ
    if (mode === 'normal') {
        let diffName = '';
        if (startLife === 0.7) diffName = 'イージー';
        else if (startLife === 0.5) diffName = 'ノーマル';
        else diffName = 'ハード';
        
        ui.mode.textContent = `Mode: ${diffName}`;
        ui.highScoreDisplay.classList.add('hidden');
    } else {
        ui.mode.textContent = 'Mode: エンドレス';
        ui.highScoreDisplay.textContent = `Best: ${highScore}`;
        ui.highScoreDisplay.classList.remove('hidden');
    }
    
    updateHeaderDisplay();
    showScreen('game');
    setupNextTurn();
}

/**
 * 次のターンの準備
 */
function setupNextTurn() {
    isRunning = false;
    
    // 目標時間生成 (3秒〜8秒)
    const minMs = 3000;
    const maxMs = 8000;
    const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    targetTime = randomMs / 1000;

    ui.target.textContent = targetTime.toFixed(3);
    ui.timer.textContent = "0.000";
    ui.turnResult.classList.add('hidden');
    
    ui.btn.textContent = "計測スタート";
    ui.btn.className = "action-btn";
    ui.btn.onclick = startTimer;
}

/**
 * タイマー開始
 */
function startTimer() {
    isRunning = true;
    startTime = performance.now();
    
    ui.btn.textContent = "ストップ！";
    ui.btn.className = "action-btn stop";
    ui.btn.onclick = stopTimer;

    requestAnimationFrame(updateTimerLoop);
}

/**
 * タイマー更新ループ
 */
function updateTimerLoop() {
    if (!isRunning) return;
    const now = performance.now();
    const elapsed = (now - startTime) / 1000;
    ui.timer.textContent = elapsed.toFixed(3);
    requestAnimationFrame(updateTimerLoop);
}

/**
 * タイマー停止＆判定処理
 */
function stopTimer() {
    isRunning = false;
    const now = performance.now();
    const finalTime = (now - startTime) / 1000;
    ui.timer.textContent = finalTime.toFixed(3);

    const diff = Math.abs(finalTime - targetTime);
    currentLife -= diff;
    
    // 結果表示
    ui.diffVal.textContent = diff.toFixed(3);
    ui.lostVal.textContent = diff.toFixed(3);
    ui.turnResult.classList.remove('hidden');
    
    updateHeaderDisplay();
    checkGameStatus();
}

/**
 * ゲーム進行判定
 */
function checkGameStatus() {
    // ゲームオーバー判定
    if (currentLife <= 0.00001) {
        currentLife = 0;
        updateHeaderDisplay();
        endGame(false);
        return;
    }

    // 成功・継続判定
    if (gameMode === 'normal') {
        if (turnCount >= NORMAL_MODE_TURNS) {
            completedTurns = NORMAL_MODE_TURNS;
            endGame(true); // 通常モードクリア
        } else {
            completedTurns = turnCount;
            prepareNextButton();
        }
    } else {
        // エンドレスモード
        completedTurns = turnCount;
        prepareNextButton();
    }
}

/**
 * 「次のターンへ」ボタンの表示設定
 */
function prepareNextButton() {
    ui.btn.textContent = "次のターンへ";
    ui.btn.className = "action-btn next";
    ui.btn.onclick = () => {
        turnCount++;
        updateHeaderDisplay();
        setupNextTurn();
    };
}

/**
 * ヘッダー情報の更新
 */
function updateHeaderDisplay() {
    ui.life.textContent = Math.max(0, currentLife).toFixed(3);
    if (currentLife < (initialLife * 0.3)) {
        ui.life.classList.add('danger');
    } else {
        ui.life.classList.remove('danger');
    }

    if (gameMode === 'normal') {
        ui.turn.textContent = `${turnCount} / ${NORMAL_MODE_TURNS}`;
    } else {
        ui.turn.textContent = `${turnCount}回目`;
    }
}

/**
 * ゲーム終了処理
 */
function endGame(isClear) {
    setTimeout(() => {
        showScreen('result');
        ui.newRecordMsg.classList.add('hidden');

        if (gameMode === 'normal') {
            if (isClear) {
                ui.resultTitle.textContent = "🎉 MISSION CLEAR! 🎉";
                ui.resultMsg.textContent = "目標達成おめでとうございます！";
                ui.finalScore.textContent = `残ライフ: ${currentLife.toFixed(3)}秒`;
            } else {
                ui.resultTitle.textContent = "💀 GAME OVER";
                ui.resultMsg.textContent = "持ち時間が尽きました...";
                ui.finalScore.textContent = `${turnCount}ターン目で脱落`;
            }
        } else {
            // エンドレスモードの結果
            ui.resultTitle.textContent = "🏁 Result (Endless)";
            ui.resultMsg.textContent = "限界まで挑戦しました";
            ui.finalScore.textContent = `記録: ${completedTurns} 回達成`;

            // ハイスコア判定
            if (completedTurns > highScore) {
                highScore = completedTurns;
                localStorage.setItem('jts_highscore', highScore);
                ui.newRecordMsg.classList.remove('hidden');
                ui.titleHighScore.textContent = highScore;
            }
        }
    }, 1000);
}

/**
 * タイトルへ戻る（クリーンアップ）
 */
function backToTitle() {
    // ゲームの状態をリセット
    isRunning = false;
    showScreen('title');
}

/**
 * 強制終了処理（ユーザー確認付き）
 */
function confirmQuit() {
    if (confirm("ゲームを中断してタイトルに戻りますか？")) {
        backToTitle();
    }
}
