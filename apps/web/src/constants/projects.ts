export type Project = {
  id: string;
  title: string;
  period: string;
  team: string;
  role: string;
  techIds: string[];
  phaseIds: string[];
  summary: string;
};

/**
 * DBに移したい。。
 */
export const PROJECTS: Project[] = [
  {
    id: "project-1",
    title: "コンシューマー向けWebサービス",
    period: "2022年8月〜2026年3月（3年8ヶ月）",
    team: "4名",
    role: "PG / チームリーダー",
    techIds: ["typescript", "react", "nextjs", "php", "symfony", "mysql", "aws", "tailwind"],
    phaseIds: ["requirements", "basic-design", "detailed-design", "development", "testing", "maintenance"],
    summary:
      "チームリーダーとして新機能の要件定義からリリースまでを一貫して担当。進捗・タスク管理を含むチームマネジメントを推進。",
  },
  {
    id: "project-2",
    title: "大手ゲーム企業 アプリゲーム開発",
    period: "2019年10月〜2022年6月（2年9ヶ月）",
    team: "20名",
    role: "PG",
    techIds: ["javascript", "backbone", "perl", "mysql", "sass"],
    phaseIds: ["detailed-design", "development", "testing", "maintenance"],
    summary: "運用中のアプリゲームの機能開発・改修を担当。ゲーム開発におけるUI/UXデザインの知見を習得。",
  },
  {
    id: "project-3",
    title: "WebViewアプリ新規開発",
    period: "2019年1月〜2019年8月（8ヶ月）",
    team: "10名",
    role: "PG",
    techIds: ["typescript", "nuxt", "vue", "sass"],
    phaseIds: ["detailed-design", "development", "testing"],
    summary: "WebViewアプリのWeb部分をNuxt + TypeScriptで新規開発。コードレビューを通じたチーム品質向上に貢献。",
  },
  {
    id: "project-4",
    title: "CMSサイト新規構築",
    period: "2017年10月〜2018年12月（1年3ヶ月）",
    team: "5名",
    role: "PG",
    techIds: ["php", "fuelphp", "mysql", "javascript", "sass"],
    phaseIds: ["detailed-design", "development", "testing", "maintenance"],
    summary: "オリジナルCMSを用いた新規サイトを構築。アジャイル手法やPHPUnitによるテスト駆動開発を実践。",
  },
  {
    id: "project-5",
    title: "企業向けCMSサイト開発・保守",
    period: "2017年4月〜2017年9月（6ヶ月）",
    team: "3名",
    role: "PG",
    techIds: ["php", "cakephp", "javascript", "jquery"],
    phaseIds: ["detailed-design", "development", "testing"],
    summary: "複数の企業向けCMSサイトの開発から保守運用・リリースまでを担当。CakePHPによるMVCパターンでの開発を習得。",
  },
  {
    id: "project-6",
    title: "人材管理システム エンハンス開発",
    period: "2016年4月〜2017年3月（1年）",
    team: "4名",
    role: "PG",
    techIds: ["javascript", "java"],
    phaseIds: ["detailed-design", "development", "testing"],
    summary: "人材管理システムの改修・保守を担当。JavaScriptによるSPA構築やテスト自動化の基盤整備を推進。",
  },
  {
    id: "project-7",
    title: "CMSサイト改修",
    period: "2016年4月〜2017年3月（1年）",
    team: "4名",
    role: "PG",
    techIds: ["php", "javascript"],
    phaseIds: ["detailed-design", "development", "testing"],
    summary: "フルスクラッチCMSの改修を担当。仕様書からの要件整理やテスト工程の設計・実施を経験。",
  },
  {
    id: "project-8",
    title: "WordPress・Androidアプリ改修",
    period: "2015年12月〜2016年3月（4ヶ月）",
    team: "10名",
    role: "PG",
    techIds: ["php", "wordpress", "java", "android"],
    phaseIds: ["detailed-design", "development", "testing"],
    summary: "WordPressサイトの改修・機能追加とAndroid WebViewアプリの開発を担当。LAMP環境でのチーム開発手法を習得。",
  },
];
