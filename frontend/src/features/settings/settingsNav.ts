/**
 * The Settings information architecture as data (docs/features/settings.md).
 *
 * A future page is: add a route in `src/app/router`, add an entry here, build
 * the page. Nothing in the modal, the responsive behaviour, the active state or
 * the close behaviour needs to change.
 *
 * Only sections with a real page ship. We do not render dead links — a group
 * with nothing functional is simply omitted until its first page lands. The
 * commented groups below are the planned shape, not a to-do list rendered on
 * screen.
 */

export type SettingsRouteTo =
  | "/settings/profile"
  | "/settings/security"
  | "/settings/appearance"
  | "/settings/app"
  | "/settings/admin/users"
  | "/settings/admin/updates-license"
  | "/settings/integrations"
  | "/settings/data/import"
  | "/settings/data/export"
  | "/settings/support/help"
  | "/settings/support/about";

export type SettingsNavItem = {
  /** Stable key, also used as the section identifier in `staticData`. */
  id:
    | "profile"
    | "security"
    | "appearance"
    | "app"
    | "users"
    | "updatesLicense"
    | "integrations"
    | "import"
    | "export"
    | "help"
    | "about";
  labelKey: string;
  to: SettingsRouteTo;
};

export type SettingsNavGroup = {
  /** Quiet hierarchy label (sentence case — DESIGN.md). */
  labelKey: string;
  items: SettingsNavItem[];
  /** Administration is visible only after the shared current-user query says
   *  the viewer is an administrator. */
  adminOnly?: boolean;
};

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    labelKey: "settings.account",
    items: [
      { id: "profile", labelKey: "settings.profile", to: "/settings/profile" },
      {
        id: "security",
        labelKey: "settings.security",
        to: "/settings/security",
      },
    ],
  },
  {
    labelKey: "settings.appearanceGroup",
    items: [
      {
        id: "appearance",
        labelKey: "settings.themeAndTime",
        to: "/settings/appearance",
      },
    ],
  },
  {
    labelKey: "settings.app",
    items: [
      { id: "app", labelKey: "settings.installOffline", to: "/settings/app" },
    ],
  },
  {
    labelKey: "settings.integrations",
    items: [
      {
        id: "integrations",
        labelKey: "settings.providers",
        to: "/settings/integrations",
      },
    ],
  },
  {
    labelKey: "settings.administration",
    adminOnly: true,
    items: [
      { id: "users", labelKey: "settings.users", to: "/settings/admin/users" },
      {
        id: "updatesLicense",
        labelKey: "settings.updatesLicense",
        to: "/settings/admin/updates-license",
      },
    ],
  },
  {
    labelKey: "settings.dataBackup",
    items: [
      {
        id: "import",
        labelKey: "settings.import",
        to: "/settings/data/import",
      },
      {
        id: "export",
        labelKey: "settings.export",
        to: "/settings/data/export",
      },
    ],
  },
  {
    labelKey: "settings.support",
    items: [
      {
        id: "help",
        labelKey: "settings.helpFeedback",
        to: "/settings/support/help",
      },
      {
        id: "about",
        labelKey: "settings.about",
        to: "/settings/support/about",
      },
    ],
  },
];

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = SETTINGS_NAV.flatMap(
  (group) => group.items,
);

export function settingsItem(id: SettingsNavItem["id"]): SettingsNavItem {
  const item = SETTINGS_NAV_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown settings section: ${id}`);
  return item;
}
