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

            Task.interval(this.#configuration.updateInterval, () => {
                this.onUpdate(this);
            });
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
            await sender.#mainViewModel.reset();
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
     * @param {Object} configuration
     */
    constructor(configuration) {
        this.#configuration = configuration;
    }

    /**
     * 画面を初期化します。
     * @param {Object} data
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

        await this.update(data);
    }

    /**
     * 画面を更新します。
     * @param {Object} data
     */
    async update(data) {
        this.setDurations(data);
        this.setTexts(data);
    }

    /**
     * リセットします。
     * 勝敗をフェードアウトして、要素の中身を空にします。
     */
    async reset() {
        const div = $('#player1-wins, #player2-wins');
        div.fadeOut(this.#configuration.duration.fade);
        await Task.delay(this.#configuration.duration.fade);
        div.empty();
        div.show();
    }

    /**
     * StreamControl JSON データの設定値で時間オプションを設定します。
     * @param {Object} data
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
     * StreamControl JSON データでテキストを設定します。
     * @param {Object} data
     */
    setTexts(data) {
        // Player 1
        $('#player1-name-main').textWithFade(
            data.matchPlayer1NameMain,
            this.#configuration.duration.fade
        );
        $('#player1-comment-main').textWithFade(
            data.matchPlayer1CommentMain,
            this.#configuration.duration.fade
        );

        if (Utility.isEmpty(data.matchPlayer1NameSub)) {
            data.matchPlayer1NameSub = data.matchPlayer1NameMain;
        }

        if (Utility.isEmpty(data.matchPlayer1CommentSub)) {
            data.matchPlayer1CommentSub = data.matchPlayer1CommentMain;
        }

        $('#player1-name-sub').textWithFade(
            data.matchPlayer1NameSub,
            this.#configuration.duration.fade,
            true
        );
        $('#player1-comment-sub').textWithFade(
            data.matchPlayer1CommentSub,
            this.#configuration.duration.fade,
            true
        );
        $('#player1-score').textWithFade(
            data.matchPlayer1Score,
            this.#configuration.duration.fade
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
            this.#configuration.duration.fade
        );
        $('#player2-comment-main').textWithFade(
            data.matchPlayer2CommentMain,
            this.#configuration.duration.fade
        );

        if (Utility.isEmpty(data.matchPlayer2NameSub)) {
            data.matchPlayer2NameSub = data.matchPlayer2NameMain;
        }

        if (Utility.isEmpty(data.matchPlayer2CommentSub)) {
            data.matchPlayer2CommentSub = data.matchPlayer2CommentMain;
        }

        $('#player2-name-sub').textWithFade(
            data.matchPlayer2NameSub,
            this.#configuration.duration.fade,
            true
        );
        $('#player2-comment-sub').textWithFade(
            data.matchPlayer2CommentSub,
            this.#configuration.duration.fade,
            true
        );
        $('#player2-score').textWithFade(
            data.matchPlayer2Score,
            this.#configuration.duration.fade
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
                this.#configuration.duration.fade
            );
            player2Wins.textWithFade(
                player2WinsString,
                this.#configuration.duration.fade
            );

            player1WinsCount += player1Win ? 1 : 0;
            player2WinsCount += player2Win ? 1 : 0;
        }

        $('#player1-wins-count').textWithFade(
            player1WinsCount.toString(),
            this.#configuration.duration.fade
        );
        $('#player2-wins-count').textWithFade(
            player2WinsCount.toString(),
            this.#configuration.duration.fade
        );
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
         */
        textWithFade: async function (text, duration, isFadeOutOnly) {
            // テキストが同一の場合、何もしません。
            if (this.text() === text) {
                return;
            }

            // テキストが非表示の場合、テキストだけを設定して終了します。
            if (this.css('opacity') === '0') {
                this.text(text);
                return;
            }

            if (Utility.isEmpty(duration)) {
                duration = 1000;
            }

            const halfDuration = parseInt(duration) / 2;

            if (Utility.isEmpty(isFadeOutOnly)) {
                isFadeOutOnly = false;
            }

            // キューのアニメーションを停止します。
            this.stop(true, true);

            // フェードアウトします。
            await this.animate({ opacity: 0 }, halfDuration).promise();

            // テキストを変更します。
            this.text(text);

            const width = this.width();
            const parentWidth = this.parent().width();
            const ratio = width <= parentWidth ? 1 : parentWidth / width;
            this.css('transform', `scaleX(${ratio})`);

            // フェードアウトのみではない場合、フェードインします。
            if (!isFadeOutOnly) {
                await this.animate({ opacity: 1 }, halfDuration).promise();
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

            this.animate({ opacity: first }, durationOptions.fade);
            await Task.delay(
                durationOptions.fade + durationOptions.mainLanguage
            );
            this.animate({ opacity: second }, durationOptions.fade);
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
     * 指定の時間だけスリーブします。
     * @param {number} milliseconds ミリ秒。
     */
    static delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }

    /**
     * 指定の時間の間隔で関数を実行します。
     * @param {number} milliseconds ミリ秒。
     * @param {Function} action 関数。
     */
    static interval(milliseconds, action, abortSignal) {
        return new Promise(resolve => {
            setInterval(() => {
                action();
                resolve();
            }, milliseconds);
        });
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
