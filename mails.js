// ===== メールのデータ =====
// 問題を増やしたいときは、このファイルに1行ずつ足していけばOK。
//   from : 差出人の表示名
//   addr : メールアドレス
//   subj : 件名
//   ans  : 'ok'（返信OK）か 'ng'（危険）
//   boss : true にすると、間違えたときに上司が「俺のメール、詐欺扱い…？」と言う
//   pt   : 答え合わせで表示する「見分けポイント」
// 会社のアドレスは @minato-shoji.example。登場する会社・人物・アドレスはすべて架空です。

const MAILS = [
  // ---------- 返信OK（本物） ----------
  { from: '部長', addr: 'bucho@minato-shoji.example', subj: '明日の会議資料、数字だけ直しといて', ans: 'ok', boss: true, pt: '会社のアドレスから、いつもの仕事の依頼' },
  { from: '課長', addr: 'kacho@minato-shoji.example', subj: '15時からの打ち合わせ、会議室Bに変更です', ans: 'ok', boss: true, pt: '会社のアドレスから、普通の連絡' },
  { from: '部長', addr: 'bucho@minato-shoji.example', subj: '忘年会の出欠、今週中に教えてね', ans: 'ok', boss: true, pt: '会社のアドレスから、いつものやりとり' },
  { from: '社長', addr: 'shacho@minato-shoji.example', subj: '来週の全社朝礼の資料を共有します', ans: 'ok', pt: '社長からでも、会社のアドレスで普通の内容ならOK' },
  { from: '社長', addr: 'shacho@minato-shoji.example', subj: '今年も一年お疲れさまでした', ans: 'ok', pt: '会社のアドレスから、年末のあいさつ' },
  { from: '同期', addr: 'douki@minato-shoji.example', subj: '今日のランチ、12時に1階集合でいい？', ans: 'ok', pt: '同期からのいつものやりとり' },
  { from: '同期', addr: 'douki@minato-shoji.example', subj: '来月の勉強会、資料作り手伝ってくれない？', ans: 'ok', pt: '会社のアドレスから、普通の相談' },
  { from: '後輩', addr: 'kohai@minato-shoji.example', subj: '先輩、昨日の資料ありがとうございました！', ans: 'ok', pt: '会社のアドレスから、ただのお礼' },
  { from: '情報システム部', addr: 'it@minato-shoji.example', subj: '【重要】不審なメールにご注意ください', ans: 'ok', pt: '件名は怖いけど、会社のアドレスから注意を呼びかけているだけ' },
  { from: '情報システム部', addr: 'it@minato-shoji.example', subj: '金曜20時からシステムメンテナンスです', ans: 'ok', pt: '会社のアドレスから、いつものお知らせ' },
  { from: '総務部', addr: 'soumu@minato-shoji.example', subj: '年末の大掃除は12月25日（金）です', ans: 'ok', pt: '会社のアドレスから、普通のお知らせ' },
  { from: '総務部', addr: 'soumu@minato-shoji.example', subj: '来週月曜は避難訓練があります', ans: 'ok', pt: '会社のアドレスから、恒例のお知らせ' },
  { from: '人事部', addr: 'jinji@minato-shoji.example', subj: '年末調整の書類は12月4日までに提出を', ans: 'ok', pt: '会社のアドレスから、毎年恒例の連絡' },
  { from: '人事部', addr: 'jinji@minato-shoji.example', subj: '健康診断の予約をお願いします', ans: 'ok', pt: '会社のアドレスから、普通の連絡' },
  { from: '経理部', addr: 'keiri@minato-shoji.example', subj: '今月の経費精算は月末締めです', ans: 'ok', pt: '会社のアドレスから、いつもの締め切りの連絡' },
  { from: '経理部', addr: 'keiri@minato-shoji.example', subj: '請求書の原本、受け取りました', ans: 'ok', pt: '会社のアドレスから、ただの報告' },
  { from: '広報部', addr: 'koho@minato-shoji.example', subj: '社内報12月号ができました', ans: 'ok', pt: '会社のアドレスから、いつものお知らせ' },
  { from: 'ハヤテ物流 営業部', addr: 'eigyo@hayate-logi.example', subj: '先日の打ち合わせ、次回の日程候補です', ans: 'ok', pt: '話の流れが自然で、お金・パスワード・添付の話がない' },
  { from: 'ハヤテ物流 営業部', addr: 'eigyo@hayate-logi.example', subj: '年末年始の配送スケジュールのお知らせ', ans: 'ok', pt: 'いつもの取引先から、時期に合ったお知らせ' },
  { from: 'アオバ商事 営業部', addr: 'eigyo@aoba-trade.example', subj: '見積書の件、本日中にご確認いただけますか', ans: 'ok', pt: '外の会社でも、いつもの取引先から普通の仕事の連絡。「本日中」だけで詐欺とは限らない' },

  // ---------- 危険（詐欺・ウイルス） ----------
  { from: '社長', addr: 'minato.shacho@freemail.example', subj: '【至急・内密に】ギフトカードを買ってきてほしい', ans: 'ng', pt: '社長なのにフリーメール。しかもギフトカード。詐欺の定番' },
  { from: '部長', addr: 'bucho@minato-shoji.example', subj: '【至急】ギフトカード5万円分の購入をお願い', ans: 'ng', pt: '会社のアドレスでも、ギフトカードを買わせるのはアカウント乗っ取りの可能性大' },
  { from: '部長', addr: 'minato.bucho@freemail.example', subj: '個人アドレスから失礼。至急この添付を開いて', ans: 'ng', pt: '部長を名乗っていてもフリーメール。「至急」「添付を開いて」はウイルスの定番' },
  { from: '社長', addr: 'shacho@minato-shoji.example', subj: '【極秘】買収の件、口外せずすぐに振り込みを', ans: 'ng', pt: '会社のアドレスでも、「極秘」「すぐ振り込み」は乗っ取りやなりすましを疑う' },
  { from: '同期', addr: 'douki.minato@freemail.example', subj: '会社のアドレス使えなくて…このリンク見て', ans: 'ng', pt: '同期を名乗っていてもフリーメール。リンクを開かせようとしている' },
  { from: '人事部', addr: 'jinji@hr-form.example', subj: '【至急】給与の振込口座をこのフォームで再登録して', ans: 'ng', pt: '人事部を名乗っているのに、会社のアドレスじゃない' },
  { from: '情報システム部', addr: 'support@password-reset.example', subj: '今のパスワードを入力して更新してください', ans: 'ng', pt: '情シスがパスワードを聞くことはない。しかも会社のアドレスじゃない' },
  { from: '社内Wi-Fi管理者', addr: 'wifi@free-wifi-login.example', subj: '社内Wi-Fiの再設定：社員番号とパスワードを入力', ans: 'ng', pt: '社内の話なのに会社のアドレスじゃない。パスワードを聞いてくる' },
  { from: 'アオバ商事 経理部', addr: 'keiri@aoba-trade.example', subj: '振込先口座が変わりました（電話確認は不要です）', ans: 'ng', pt: 'いつもの取引先のアドレスでも、振込先の変更はメールだけで信じない。電話で確認' },
  { from: 'ミドリ工業', addr: 'seikyu@midori-kogyo.example', subj: '請求書.zip を送付します（パスワードは別メールで）', ans: 'ng', pt: '知らない会社からのパスワード付きzipはウイルスの定番' },
  { from: 'みらい銀行', addr: 'info@mirai-bank-alert.example', subj: '【最終警告】24時間以内に本人確認しないと口座凍結', ans: 'ng', pt: '「凍結」で脅して急がせるのはフィッシングの定番' },
  { from: 'ネットバンク事務局', addr: 'notice@netbank-center.example', subj: '【重要】ワンタイムパスワードを返信してください', ans: 'ng', pt: 'ワンタイムパスワードをメールで聞いてくる銀行はない' },
  { from: 'カード会社 セキュリティ部', addr: 'alert@card-security.example', subj: '不正利用の疑い。カード番号を再入力してください', ans: 'ng', pt: 'カード番号をメールのリンクから入力させるのは詐欺' },
  { from: 'ネコヤマ運輸', addr: 'info@nekoyama-delivery.example', subj: '不在のため持ち帰りました。アプリを入れて再配達を', ans: 'ng', pt: '宅配業者がアプリのインストールを求めることはまずない' },
  { from: '抽選事務局', addr: 'campaign@lucky-present.example', subj: '【当選】最新スマホが当たりました！送料だけお支払いを', ans: 'ng', pt: '応募した覚えのない当選＋支払いの要求は詐欺' },
  { from: '還付金センター', addr: 'info@tax-refund-notice.example', subj: '【還付金のお知らせ】受け取り手続きは本日まで', ans: 'ng', pt: 'お金がもらえる話＋「本日まで」で急がせるのは詐欺の定番' },
  { from: 'クラウドストレージ事務局', addr: 'no-reply@storage-notice.example', subj: '容量がいっぱいです。今すぐログインして延長を', ans: 'ng', pt: '焦らせてログインさせ、IDとパスワードを盗む手口' },
  { from: 'SNSサポート', addr: 'support@sns-account-check.example', subj: 'アカウントが削除されます。異議申し立てはこちら', ans: 'ng', pt: '「削除されます」で脅してリンクを押させる手口' },
  { from: '通販サイト', addr: 'order@shopping-order.example', subj: 'ご注文確定：最新ゲーム機 98,000円（キャンセルはこちら）', ans: 'ng', pt: '身に覚えのない注文で焦らせて、キャンセルのリンクを押させる手口' },
  { from: '昔の友達', addr: 'hello@random-mail.example', subj: '久しぶり！写真送るね（添付：photo.exe）', ans: 'ng', pt: '.exeはプログラムのファイル。写真ではない' },
];
