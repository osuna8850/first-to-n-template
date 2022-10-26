/**
 * First to N Template のメインモジュールです。
 * @module main
 */

/// <reference path="lib/jquery/jquery-3.6.0.min.js" />
/// <reference path="lib/jquery-ui/jquery-ui.min.js" />

/**
 * アプリケーションを表します。
 */
class App {
    /**
     * 構成設定の URL。
     */
    static #CONFIGURAIOTN_URL = 'scripts/appsettings.json';

    /**
     * StreamControl JSON データ。
     */
    data;

    /**
     * 構成設定。
     */
    #configuration;

    /**
     * メインビューモデル。
     */
    #mainViewModel;

    /**
     * タイマー。
     */
    #timer;

    /**
     * アプリケーションの新しいインスタンスを初期化します。
     */
    constructor() {
        $.fn.extend(Extensions.jQuery);
    }

    /**
     * アプリケーションを実行します。
     */
    run() {
        $(async () => {
            this.#configuration = await this.getJSON(App.#CONFIGURAIOTN_URL);
            this.#mainViewModel = new MainViewModel(this.#configuration);

            await this.onInitialize();

            this.#timer = new Timer(this.#configuration.updateInterval);
            this.#timer.action = async () => {
                await this.onUpdate(this);
            };
            this.#timer.start();
        });
    }

    /**
     * JSON データを取得します。
     * @param {string} url JSON の URL。
     * @returns {Object} JSON データ。
     */
    getJSON(url) {
        return $.getJSON(`${url}?v=${Date.now()}`);
    }

    /**
     * アプリケーションの初期化時の処理を実行します。
     * @param {App} sender アプリケーション。
     */
    async onInitialize() {
        const data = await this.getJSON(
            this.#configuration.streamControlDataUrl
        );

        await this.#mainViewModel.initialize(data);

        // StreamControl JSON データをバックアップします。
        this.data = data;
    }

    /**
     * アプリケーションの更新時の処理を実行します。
     * @param {App} sender アプリケーション。
     */
    async onUpdate(sender) {
        const data = await this.getJSON(
            sender.#configuration.streamControlDataUrl
        );

        // タイムスタンプに変更がない場合は処理しません。
        if (
            sender.data !== undefined &&
            sender.data.timestamp === data.timestamp
        ) {
            return;
        }

        // N 先が変更された場合はリセットします。
        if (
            sender.data !== undefined &&
            sender.data.matchFirstTo !== data.matchFirstTo
        ) {
            sender.#timer.stop();
            await sender.#mainViewModel.reset();
            sender.#timer.start();
        }

        await sender.#mainViewModel.update(data);

        // StreamControl JSON データをバックアップします。
        sender.data = data;
    }
}

/**
 * メイン画面のビューモデルです。
 */
class MainViewModel {
    /**
     * 構成設定。
     */
    #configuration;

    /**
     * メインビューモデルの新しいインスタンスを初期化します。
     * @param {Object} configuration 構成設定。
     */
    constructor(configuration) {
        this.#configuration = configuration;
    }

    /**
     * 画面を初期化します。
     * @param {Object} data StreamControl JSON データ。
     */
    async initialize(data) {
        this.setDurations(data);

        // 起動時の表示アニメーションを実行します。
        $('#player1-background')
            .show()
            .effect(
                'slide',
                { direction: 'left' },
                this.#configuration.duration.fade
            );
        $('#player2-background')
            .show()
            .effect(
                'slide',
                { direction: 'right' },
                this.#configuration.duration.fade
            );
        $('#team1')
            .show()
            .effect(
                'slide',
                { direction: 'left' },
                this.#configuration.duration.fade
            );
        $('#team2')
            .show()
            .effect(
                'slide',
                { direction: 'right' },
                this.#configuration.duration.fade
            );
        await Task.delay(this.#configuration.duration.fade);

        // クロスフェードのアニメーションを登録します。
        $('#player1-name-main').crossFadeWithRotation(
            this.#configuration.duration,
            true
        );
        $('#player1-name-sub').crossFadeWithRotation(
            this.#configuration.duration,
            false
        );
        $('#player1-comment-main').crossFadeWithRotation(
            this.#configuration.duration,
            true
        );
        $('#player1-comment-sub').crossFadeWithRotation(
            this.#configuration.duration,
            false
        );
        $('#player2-name-main').crossFadeWithRotation(
            this.#configuration.duration,
            true
        );
        $('#player2-name-sub').crossFadeWithRotation(
            this.#configuration.duration,
            false
        );
        $('#player2-comment-main').crossFadeWithRotation(
            this.#configuration.duration,
            true
        );
        $('#player2-comment-sub').crossFadeWithRotation(
            this.#configuration.duration,
            false
        );

        // チーム情報
        for (
            let number = 1;
            number <= this.#configuration.teamPlayersCount.max;
            number++
        ) {
            $(`#team1-player${number}-name-main`).crossFadeWithRotation(
                this.#configuration.duration,
                true
            );
            $(`#team1-player${number}-name-sub`).crossFadeWithRotation(
                this.#configuration.duration,
                false
            );

            $(`#team2-player${number}-name-main`).crossFadeWithRotation(
                this.#configuration.duration,
                true
            );
            $(`#team2-player${number}-name-sub`).crossFadeWithRotation(
                this.#configuration.duration,
                false
            );
        }

        await this.update(data);
    }

    /**
     * 画面を更新します。
     * @param {Object} data StreamControl JSON データ。
     */
    async update(data) {
        this.setDurations(data);
        await this.setLayouts(data);
        this.setTeams(data);
        this.setTexts(data);
    }

    /**
     * リセットします。
     * 勝敗をフェードアウトして、要素の中身を空にします。
     */
    async reset() {
        const div = $('#player1-wins, #player2-wins');
        div.animate({ opacity: 0 }, this.#configuration.duration.fade);
        await Task.delay(this.#configuration.duration.fade);
        div.empty();
        div.stop().css({ opacity: 1 });
    }

    /**
     * StreamControl JSON データの設定値で時間オプションを設定します。
     * @param {Object} data StreamControl JSON データ。
     */
    setDurations(data) {
        if (!Utility.isEmpty(data.optionsDurationMainLanguage)) {
            this.#configuration.duration.mainLanguage = parseInt(
                data.optionsDurationMainLanguage
            );
        }

        if (!Utility.isEmpty(data.optionsDurationSubLanguage)) {
            this.#configuration.duration.subLanguage = parseInt(
                data.optionsDurationSubLanguage
            );
        }

        if (!Utility.isEmpty(data.optionsDurationFade)) {
            this.#configuration.duration.fade = parseInt(
                data.optionsDurationFade
            );
        }
    }

    /**
     * StreamControl JSON データの設定値でレイアウトオプションを設定します。
     * @param {Object} data StreamControl JSON データ。
     */
    async setLayouts(data) {
        if (!Utility.isEmpty(data.optionsLayoutFirstToNWidth)) {
            this.#configuration.layout.firstToNWidth =
                data.optionsLayoutFirstToNWidth;
        }

        if (!Utility.isEmpty(data.optionsLayoutTeamInfoWidth)) {
            this.#configuration.layout.teamInfoWidth =
                data.optionsLayoutTeamInfoWidth;
        }

        if (!Utility.isEmpty(data.optionsLayoutTeamInfoMarginTop)) {
            this.#configuration.layout.teamInfoMarginTop =
                data.optionsLayoutTeamInfoMarginTop;
        }

        $('.first-to-n').animate(
            {
                width: this.#configuration.layout.firstToNWidth,
            },
            this.#configuration.duration.fade
        );

        $('.team-info').animate(
            {
                width: this.#configuration.layout.teamInfoWidth,
            },
            this.#configuration.duration.fade
        );

        $('.team-info').animate(
            {
                marginTop: this.#configuration.layout.teamInfoMarginTop,
            },
            this.#configuration.duration.fade
        );

        await Task.delay(this.#configuration.duration.fade);
    }

    /**
     * StreamControl JSON データの設定値でチームオプションを設定します。
     * @param {Object} data StreamControl JSON データ。
     */
    setTeams(data) {
        if (!Utility.isEmpty(data.optionsTeam1PlayerCount)) {
            const count = parseInt(data.optionsTeam1PlayerCount);

            this.#configuration.teamPlayersCount.team1 =
                count <= this.#configuration.teamPlayersCount.max
                    ? count
                    : this.#configuration.teamPlayersCount.max;
        }

        if (!Utility.isEmpty(data.optionsTeam2PlayerCount)) {
            const count = parseInt(data.optionsTeam2PlayerCount);

            this.#configuration.teamPlayersCount.team2 =
                count <= this.#configuration.teamPlayersCount.max
                    ? count
                    : this.#configuration.teamPlayersCount.max;
        }
    }

    /**
     * StreamControl JSON データでテキストを設定します。
     * @param {Object} data StreamControl JSON データ。
     */
    setTexts(data) {
        // Player 1
        $('#player1-name-main').textWithFade(
            data.matchPlayer1NameMain,
            this.#configuration.duration.fade,
            false,
            true
        );
        $('#player1-comment-main').textWithFade(
            data.matchPlayer1CommentMain,
            this.#configuration.duration.fade,
            false,
            true
        );

        // サブの入力がない場合、メインを表示します。
        if (Utility.isEmpty(data.matchPlayer1NameSub)) {
            data.matchPlayer1NameSub = data.matchPlayer1NameMain;
        }

        if (Utility.isEmpty(data.matchPlayer1CommentSub)) {
            data.matchPlayer1CommentSub = data.matchPlayer1CommentMain;
        }

        $('#player1-name-sub').textWithFade(
            data.matchPlayer1NameSub,
            this.#configuration.duration.fade,
            true,
            true
        );
        $('#player1-comment-sub').textWithFade(
            data.matchPlayer1CommentSub,
            this.#configuration.duration.fade,
            true,
            true
        );
        $('#player1-score').textWithFade(
            data.matchPlayer1Score,
            this.#configuration.duration.fade,
            false,
            true
        );

        if (Utility.isEmpty(data.matchPlayer1CommentMain)) {
            $('#player1-name-main').switchClass('name-area', 'name-area-big');
        } else {
            $('#player1-name-main').switchClass('name-area-big', 'name-area');
        }

        if (Utility.isEmpty(data.matchPlayer1CommentSub)) {
            $('#player1-name-sub').switchClass('name-area', 'name-area-big');
        } else {
            $('#player1-name-sub').switchClass('name-area-big', 'name-area');
        }

        // Player 2
        $('#player2-name-main').textWithFade(
            data.matchPlayer2NameMain,
            this.#configuration.duration.fade,
            false,
            true
        );
        $('#player2-comment-main').textWithFade(
            data.matchPlayer2CommentMain,
            this.#configuration.duration.fade,
            false,
            true
        );

        // サブの入力がない場合、メインを表示します。
        if (Utility.isEmpty(data.matchPlayer2NameSub)) {
            data.matchPlayer2NameSub = data.matchPlayer2NameMain;
        }

        if (Utility.isEmpty(data.matchPlayer2CommentSub)) {
            data.matchPlayer2CommentSub = data.matchPlayer2CommentMain;
        }

        $('#player2-name-sub').textWithFade(
            data.matchPlayer2NameSub,
            this.#configuration.duration.fade,
            true,
            true
        );
        $('#player2-comment-sub').textWithFade(
            data.matchPlayer2CommentSub,
            this.#configuration.duration.fade,
            true,
            true
        );
        $('#player2-score').textWithFade(
            data.matchPlayer2Score,
            this.#configuration.duration.fade,
            false,
            true
        );

        if (Utility.isEmpty(data.matchPlayer2CommentMain)) {
            $('#player2-name-main').switchClass('name-area', 'name-area-big');
        } else {
            $('#player2-name-main').switchClass('name-area-big', 'name-area');
        }

        if (Utility.isEmpty(data.matchPlayer2CommentSub)) {
            $('#player2-name-sub').switchClass('name-area', 'name-area-big');
        } else {
            $('#player2-name-sub').switchClass('name-area-big', 'name-area');
        }

        // 勝敗
        let player1WinsCount = 0;
        let player2WinsCount = 0;
        const firstTo = parseInt(data.matchFirstTo);
        for (let number = 1; number < firstTo * 2; number++) {
            const player1Win =
                data[`matchPlayer1Wins${number}`] === CheckBoxValue.CHECKED;
            const player2Win =
                data[`matchPlayer2Wins${number}`] === CheckBoxValue.CHECKED;

            const player1WinsString = this.getWinAndLoseString(
                player1Win,
                player2Win
            );
            const player2WinsString = this.getWinAndLoseString(
                player2Win,
                player1Win
            );

            const player1Wins = this.findAndCreateDivIfNotExists(
                'player1-wins',
                number,
                firstTo,
                player1WinsString
            );
            const player2Wins = this.findAndCreateDivIfNotExists(
                'player2-wins',
                number,
                firstTo,
                player2WinsString
            );

            player1Wins.textWithFade(
                player1WinsString,
                this.#configuration.duration.fade,
                false,
                true
            );
            player2Wins.textWithFade(
                player2WinsString,
                this.#configuration.duration.fade,
                false,
                true
            );

            player1WinsCount += player1Win ? 1 : 0;
            player2WinsCount += player2Win ? 1 : 0;
        }

        $('#player1-wins-count').textWithFade(
            player1WinsCount.toString(),
            this.#configuration.duration.fade,
            false,
            true
        );
        $('#player2-wins-count').textWithFade(
            player2WinsCount.toString(),
            this.#configuration.duration.fade,
            false,
            true
        );

        // チーム情報
        for (
            let number = 1;
            number <= this.#configuration.teamPlayersCount.max;
            number++
        ) {
            // チーム人数より大きいチームプレイヤー情報は隠します。
            // また、Lose にチェックがある場合は半透明、そうでなければ表示します。
            if (this.#configuration.teamPlayersCount.team1 < number) {
                $(`#team1-player${number}`).animate(
                    { opacity: 0 },
                    this.#configuration.duration.fade
                );
            } else if (
                data[`team1Player${number}IsLose`] === CheckBoxValue.CHECKED
            ) {
                $(`#team1-player${number}`).animate(
                    { opacity: 0.5 },
                    this.#configuration.duration.fade
                );
            } else {
                $(`#team1-player${number}`).animate(
                    { opacity: 1 },
                    this.#configuration.duration.fade
                );
            }

            if (this.#configuration.teamPlayersCount.team2 < number) {
                $(`#team2-player${number}`).animate(
                    { opacity: 0 },
                    this.#configuration.duration.fade
                );
            } else if (
                data[`team2Player${number}IsLose`] === CheckBoxValue.CHECKED
            ) {
                $(`#team2-player${number}`).animate(
                    { opacity: 0.5 },
                    this.#configuration.duration.fade
                );
            } else {
                $(`#team2-player${number}`).animate(
                    { opacity: 1 },
                    this.#configuration.duration.fade
                );
            }

            // サブの入力がない場合、メインを表示します。
            if (Utility.isEmpty(data[`team1Player${number}NameSub`])) {
                data[`team1Player${number}NameSub`] =
                    data[`team1Player${number}NameMain`];
            }

            if (Utility.isEmpty(data[`team2Player${number}NameSub`])) {
                data[`team2Player${number}NameSub`] =
                    data[`team2Player${number}NameMain`];
            }

            $(`#team1-player${number}-name-main`).textWithFade(
                data[`team1Player${number}NameMain`],
                this.#configuration.duration.fade,
                false,
                true
            );
            $(`#team1-player${number}-name-sub`).textWithFade(
                data[`team1Player${number}NameSub`],
                this.#configuration.duration.fade,
                true,
                true
            );

            $(`#team2-player${number}-name-main`).textWithFade(
                data[`team2Player${number}NameMain`],
                this.#configuration.duration.fade,
                false,
                true
            );
            $(`#team2-player${number}-name-sub`).textWithFade(
                data[`team2Player${number}NameSub`],
                this.#configuration.duration.fade,
                true,
                true
            );

            // アクティブを設定します。
            if (number === parseInt(data.team1ActivePlayer)) {
                $(`#team1-player${number}`).addClass(
                    'active',
                    this.#configuration.duration.fade
                );
            } else {
                $(`#team1-player${number}`).removeClass(
                    'active',
                    this.#configuration.duration.fade
                );
            }

            if (number === parseInt(data.team2ActivePlayer)) {
                $(`#team2-player${number}`).addClass(
                    'active',
                    this.#configuration.duration.fade
                );
            } else {
                $(`#team2-player${number}`).removeClass(
                    'active',
                    this.#configuration.duration.fade
                );
            }
        }
    }

    /**
     * 勝敗文字列を取得します。
     * @param {boolean} selfWin 自身が勝利しているかどうか。
     * @param {boolean} otherWin 相手が勝利しているかどうか。
     */
    getWinAndLoseString(selfWin, otherWin) {
        if (selfWin || otherWin) {
            if (selfWin) {
                return WinAndLoseString.WIN;
            } else {
                return WinAndLoseString.LOSE;
            }
        } else {
            return WinAndLoseString.NONE;
        }
    }

    /**
     * DIV を検索し、存在しなければ作成します。
     * @param {string} parentId 親要素の ID。
     * @param {number} number 番号。
     * @param {number} fisrtTo N 先の数。
     * @param {string} text テキスト。
     */
    findAndCreateDivIfNotExists(parentId, number, fisrtTo, text) {
        let div = $(`#${parentId}${number}`);
        if (div.length === 0) {
            div = $('<div>');
            div.appendTo($(`#${parentId}`));
            div.attr('id', `${parentId}${number}`);
            div.addClass('wins text-center');
            div.css('width', `${100 / (fisrtTo - 1)}%`);
        }

        return div;
    }
}

/**
 * 拡張メソッドを定義します。
 */
class Extensions {
    /**
     * jQuery の拡張メソッドオブジェクト。
     */
    static jQuery = {
        /**
         * テキストを設定し、フェードのアニメーションを行います。
         * @param {string} text テキスト。
         * @param {number} duration フェード時間。
         * @param {boolean} isFadeOutOnly フェードアウトのみかどうか。
         * @param {boolean} isOverwrite アニメーションを上書きするかどうか。
         */
        textWithFade: async function (
            text,
            duration,
            isFadeOutOnly,
            isOverwrite
        ) {
            // テキストが同一の場合、何もしません。
            if (this.text() === text) {
                return;
            }

            // テキストが非表示の場合、テキストだけを設定して終了します。
            if (this.css('opacity') === '0') {
                this.text(text);

                const width = this.width();
                const parentWidth =
                    this.parent().width() + width - this.outerWidth(true);
                const ratio = width <= parentWidth ? 1 : parentWidth / width;
                this.css('transform', `scaleX(${ratio})`);

                return;
            }

            if (Utility.isEmpty(duration)) {
                duration = 1000;
            }

            const halfDuration = parseInt(duration) / 2;

            if (Utility.isEmpty(isFadeOutOnly)) {
                isFadeOutOnly = false;
            }

            if (Utility.isEmpty(isOverwrite)) {
                isOverwrite = false;
            }

            if (isOverwrite) {
                this.stop(true, true);
            }

            // フェードアウトします。
            this.stop().animate({ opacity: 0 }, halfDuration);
            await Task.delay(halfDuration);

            // テキストを変更します。
            this.text(text);

            const width = this.width();
            const parentWidth =
                this.parent().width() + width - this.outerWidth(true);
            const ratio = width <= parentWidth ? 1 : parentWidth / width;
            this.css('transform', `scaleX(${ratio})`);

            // フェードアウトのみではない場合、フェードインします。
            if (!isFadeOutOnly) {
                this.stop().animate({ opacity: 1 }, halfDuration);
                await Task.delay(halfDuration);
            }
        },

        /**
         * クロスフェードでローテーションします。
         * @param {Object} durationOptions 時間オプション。
         * @param {boolean} isFirstFadeIn 初回がフェードインかどうか。
         */
        crossFadeWithRotation: function (durationOptions, isFirstFadeIn) {
            Task.run(async () => {
                while (true) {
                    this.crossFade(durationOptions, isFirstFadeIn);

                    const duration =
                        durationOptions.mainLanguage +
                        durationOptions.subLanguage +
                        durationOptions.fade * 2;
                    await Task.delay(duration);
                }
            });
        },

        /**
         * クロスフェードします。
         * @param {Object} durationOptions 時間オプション。
         * @property {boolean} isFirstFadeIn 初回がフェードインかどうか。
         */
        crossFade: async function (durationOptions, isFirstFadeIn) {
            const first = isFirstFadeIn ? 1 : 0;
            const second = isFirstFadeIn ? 0 : 1;

            this.stop().animate({ opacity: first }, durationOptions.fade);
            await Task.delay(
                durationOptions.fade + durationOptions.mainLanguage
            );
            this.stop().animate({ opacity: second }, durationOptions.fade);
            await Task.delay(
                durationOptions.fade + durationOptions.subLanguage
            );
        },

        /**
         * クラスを切り替えます。
         * @param {string} remove 削除するクラス。
         * @param {string} add 追加するクラス。
         */
        switchClass: function (remove, add) {
            this.removeClass(remove);
            this.addClass(add);
        },
    };
}

/**
 * ユーティリティ関数を定義します。
 */
class Utility {
    /**
     * 値が空かどうか確認します。
     * @param {Object} value
     * @returns {boolean} 値が空の場合は true、そうでなければ false。
     */
    static isEmpty(value) {
        return !value;
    }
}

/**
 * タスクを表します。
 */
class Task {
    /**
     * 新しいタスクで関数を実行します。
     * @param {Function} action 関数。
     */
    static run(action) {
        return new Promise(resolve => {
            action();
            resolve();
        });
    }

    /**
     * 指定の時間だけスリープします。
     * @param {number} milliseconds ミリ秒。
     */
    static delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }
}

/**
 * タイマーを表します。
 */
class Timer {
    /**
     * タイマーの刻み間隔の時間。
     */
    interval = 0;

    /**
     * 実行する関数。
     */
    action = () => {};

    /**
     * タイマー ID。
     */
    #id;

    /**
     * タイマーの新しいインスタンスを初期化します。
     * @param {number} interval タイマーの刻み間隔。
     */
    constructor(interval) {
        this.interval = interval;
    }

    /**
     * タイマーを開始します。
     */
    start() {
        this.#id = setInterval(this.action, this.interval);
    }

    /**
     * タイマーを停止します。
     */
    stop() {
        clearInterval(this.#id);
    }
}

/**
 * チェックボックスの値。
 * @enum {string}
 */
const CheckBoxValue = {
    UNCHECKED: '0',
    CHECKED: '1',
};

/**
 * 勝敗。
 * @enum {string}
 */
const WinAndLoseString = {
    NONE: '',
    WIN: 'V',
    LOSE: '-',
};

const app = new App();
app.run();
