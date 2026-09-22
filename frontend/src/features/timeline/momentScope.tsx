import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MomentFilters } from "../../api/query/keys";
import {
  activitiesQuery,
  goalsQuery,
  journalsQuery,
  moodsQuery,
  peopleQuery,
  tagsQuery,
} from "../../api/query/options";
import { EntityGlyph } from "../../components/journiv/EntityGlyph";
import { JournalDot } from "../../components/journiv/JournalBadge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";

/**
 * "All moments associated with X" — the one surface behind every entity's
 * "View moments" (docs/features/library.md). The journal-scoped Timeline was already this
 * pattern; this generalises it to a person, tag, activity, mood or goal, chosen
 * by a single URL search param that rides the list and reader routes.
 *
 * At most one scope is active. Journal wins (it is a path param); otherwise the
 * first entity param set is used. The hook resolves the entity's name and
 * identity mark from the same cached Library list the management screens use, so
 * a scoped visit costs one list fetch and nothing more.
 */

export type MomentScopeKind =
  | "all"
  | "journal"
  | "person"
  | "tag"
  | "activity"
  | "mood"
  | "goal";

export type MomentScope = {
  kind: MomentScopeKind;
  /** The scoped entity's id; absent for `"all"`. */
  id?: string;
  /** Filters for `momentsQuery` (search is merged in by the caller). */
  filters: MomentFilters;
  /** Header title: the resolved entity name, or a neutral fallback while the
   *  list loads or when the id no longer resolves. Tags carry their `#`. */
  title: string;
  /** Identity mark for the header, when the scope has one. */
  glyph: ReactNode;
  /** Accessible label for the list's search field. */
  searchLabel: string;
  /** Empty-state copy when the scope has no moments and no active search. */
  emptyTitle: string;
  emptyDescription: string;
  /** The list that names the scope is still loading. */
  isResolving: boolean;
  /** The list that names the scope failed to load. */
  isError: boolean;
  /** Retry resolving the scoped entity after its lookup query fails. */
  refetch: () => void;
};

/** The search params that carry an entity scope, in precedence order. */
export const SCOPE_SEARCH_KEYS = [
  "person",
  "tag",
  "activity",
  "mood",
  "goal",
] as const;

type ScopeSearch = Partial<Record<(typeof SCOPE_SEARCH_KEYS)[number], string>>;

/** The active scope params, to thread onto row and search links so a scoped
 *  list stays scoped when a moment opens beside it. */
export function scopeSearchFrom(search: ScopeSearch): ScopeSearch {
  const out: ScopeSearch = {};
  for (const key of SCOPE_SEARCH_KEYS) {
    if (search[key]) out[key] = search[key];
  }
  return out;
}

export function useMomentScope(): MomentScope {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { journalId?: string };
  const search = useSearch({ strict: false }) as ScopeSearch;

  let kind: MomentScopeKind = "all";
  let id: string | undefined;
  if (params.journalId) {
    kind = "journal";
    id = params.journalId;
  } else {
    for (const key of SCOPE_SEARCH_KEYS) {
      if (search[key]) {
        kind = key;
        id = search[key];
        break;
      }
    }
  }

  const journals = useQuery({
    ...journalsQuery(),
    enabled: kind === "journal",
  });
  const people = useQuery({ ...peopleQuery(), enabled: kind === "person" });
  const tags = useQuery({ ...tagsQuery(), enabled: kind === "tag" });
  const activities = useQuery({
    ...activitiesQuery(),
    enabled: kind === "activity",
  });
  const moods = useQuery({ ...moodsQuery(), enabled: kind === "mood" });
  const goals = useQuery({ ...goalsQuery(), enabled: kind === "goal" });

  const source = {
    journal: journals,
    person: people,
    tag: tags,
    activity: activities,
    mood: moods,
    goal: goals,
  }[kind === "all" ? "journal" : kind];

  const isResolving = kind !== "all" && source.isLoading;
  const isError = kind !== "all" && source.isError;

  if (kind === "all") {
    return {
      kind,
      filters: {},
      title: t("nav.allJournals"),
      glyph: null,
      searchLabel: t("timeline.searchAll"),
      emptyTitle: t("timeline.noMoments"),
      emptyDescription: t("timeline.noMomentsDescription"),
      isResolving: false,
      isError: false,
      refetch: () => undefined,
    };
  }

  if (kind === "journal") {
    const journal = journals.data?.find((item) => item.id === id);
    const title = journal?.title ?? t("timeline.journalFallback");
    return {
      kind,
      id,
      filters: { journal_id: id },
      title,
      glyph:
        journal && (journal.color || journal.icon) ? (
          <JournalDot journal={journal} className="jv-list-header__dot" />
        ) : null,
      searchLabel: t("timeline.searchJournal", { title }),
      emptyTitle: t("timeline.noMoments"),
      emptyDescription: t("timeline.journalEmptyDescription"),
      isResolving,
      isError,
      refetch: () => void journals.refetch(),
    };
  }

  if (kind === "person") {
    const person = people.data?.find((item) => item.id === id);
    const title = person?.name ?? t("timeline.personFallback");
    const initial = title.trim().charAt(0).toUpperCase() || "?";
    return {
      kind,
      id,
      filters: { person_id: id },
      title,
      glyph: (
        <Avatar className="jv-person__avatar" aria-hidden="true">
          {person?.profile_image_url && (
            <AvatarImage src={person.profile_image_url} alt="" loading="lazy" />
          )}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      ),
      searchLabel: t("timeline.searchWithPerson", { title }),
      emptyTitle: t("timeline.noMomentsWith", { title }),
      emptyDescription: t("timeline.personEmptyDescription"),
      isResolving,
      isError,
      refetch: () => void people.refetch(),
    };
  }

  if (kind === "tag") {
    const tag = tags.data?.find((item) => item.id === id);
    const title = tag ? `#${tag.name}` : t("timeline.tagFallback");
    return {
      kind,
      id,
      filters: { tag_id: id },
      title,
      glyph: null,
      searchLabel: t("timeline.searchEntity", { title }),
      emptyTitle: t("timeline.noEntityMoments", { title }),
      emptyDescription: t("timeline.tagEmptyDescription"),
      isResolving,
      isError,
      refetch: () => void tags.refetch(),
    };
  }

  if (kind === "activity") {
    const activity = activities.data?.find((item) => item.id === id);
    const title = activity?.name ?? t("timeline.activityFallback");
    return {
      kind,
      id,
      filters: { activity_id: id },
      title,
      glyph: activity ? (
        <EntityGlyph color={activity.color} icon={activity.icon} size={16} />
      ) : null,
      searchLabel: t("timeline.searchEntity", { title }),
      emptyTitle: t("timeline.noEntityMoments", { title }),
      emptyDescription: t("timeline.activityEmptyDescription"),
      isResolving,
      isError,
      refetch: () => void activities.refetch(),
    };
  }

  if (kind === "mood") {
    const mood = moods.data?.find((item) => item.id === id);
    const title = mood?.name ?? t("timeline.moodFallback");
    return {
      kind,
      id,
      filters: { mood_id: id },
      title,
      glyph: mood ? (
        <EntityGlyph colorValue={mood.color_value} size={16} />
      ) : null,
      searchLabel: t("timeline.searchEntity", { title }),
      emptyTitle: t("timeline.noEntityMoments", { title }),
      emptyDescription: t("timeline.moodEmptyDescription"),
      isResolving,
      isError,
      refetch: () => void moods.refetch(),
    };
  }

  // goal
  const goal = goals.data?.find((item) => item.id === id);
  const title = goal?.title ?? t("timeline.goalFallback");
  return {
    kind: "goal",
    id,
    filters: { goal_id: id },
    title,
    glyph: goal ? (
      <EntityGlyph colorValue={goal.color_value} icon={goal.icon} size={16} />
    ) : null,
    searchLabel: t("timeline.searchGoal", { title }),
    emptyTitle: t("timeline.noGoalMoments", { title }),
    emptyDescription: t("timeline.goalEmptyDescription"),
    isResolving,
    isError,
    refetch: () => void goals.refetch(),
  };
}
