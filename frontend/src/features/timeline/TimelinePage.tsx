import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Menu,
  NotebookPen,
  SearchX,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { momentsQuery } from "../../api/query/options";
import { ListViewSwitch } from "../../components/journiv/ListViewSwitch";
import { PageBar } from "../../components/journiv/PageBar";
import { StatusView } from "../../components/journiv/StatusView";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { SearchInput } from "../../components/ui/search-input";
import { Skeleton } from "../../components/ui/skeleton";
import { useJournalLookup } from "../../lib/useJournalLookup";
import { usePaneScrollRestoration } from "../../lib/usePaneScrollRestoration";
import { QUICK_LOG_ENABLED, useShell } from "../shell/shellContext";
import { groupMomentsByDay } from "./dateGroups";
import { MomentListItem } from "./MomentListItem";
import { scopeSearchFrom, useMomentScope } from "./momentScope";
import "./timeline.css";

export function TimelinePage() {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as {
    q?: string;
    person?: string;
    tag?: string;
    activity?: string;
    mood?: string;
    goal?: string;
  };
  const params = useParams({ strict: false }) as { momentId?: string };
  const navigate = useNavigate();
  const shell = useShell();
  const [input, setInput] = useState(search.q ?? "");
  const journals = useJournalLookup();
  const scope = useMomentScope();
  // `useSearch` returns a structurally-stable object, so this recomputes only
  // when a search value actually changes.
  const scopeSearch = useMemo(() => scopeSearchFrom(search), [search]);
  const canWriteFromEmpty = scope.kind === "all" || scope.kind === "journal";

  useEffect(() => setInput(search.q ?? ""), [search.q]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input === (search.q ?? "")) return;
      if (scope.kind === "journal" && scope.id) {
        void navigate({
          to: "/journals/$journalId",
          params: { journalId: scope.id },
          search: { q: input },
          replace: true,
        });
      } else {
        void navigate({
          to: "/timeline",
          search: { q: input, ...scopeSearch },
          replace: true,
        });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input, navigate, scope.kind, scope.id, scopeSearch, search.q]);

  const data = useInfiniteQuery(
    momentsQuery({
      ...scope.filters,
      search: search.q || undefined,
    }),
  );
  const scrollRef = usePaneScrollRestoration<HTMLDivElement>(
    "timeline",
    data.isLoading || scope.isResolving,
  );
  const moments = data.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupMomentsByDay(moments);

  return (
    <section className="jv-shell__list" aria-label={t("timeline.ariaLabel")}>
      <PageBar
        className="jv-page-bar--compact-only"
        leading={
          <IconButton
            label={t("nav.openNavigation")}
            onClick={shell.openNavigation}
          >
            <Menu aria-hidden="true" size={19} />
          </IconButton>
        }
        title={<span className="jv-label jv-truncate">{scope.title}</span>}
        actions={
          QUICK_LOG_ENABLED ? (
            <IconButton label={t("nav.quickLog")} onClick={shell.openQuickLog}>
              <Zap aria-hidden="true" size={19} />
            </IconButton>
          ) : undefined
        }
      />

      <header className="jv-list-header">
        {scope.kind !== "all" && (
          <Link className="jv-scope-clear" to="/timeline" search={{ q: "" }}>
            <ArrowLeft aria-hidden="true" size={14} />
            {t("timeline.allMoments")}
          </Link>
        )}
        <div className="jv-list-header__row">
          <h1 className="jv-display jv-list-header__title">
            {scope.glyph}
            <span className="jv-truncate">{scope.title}</span>
          </h1>
          <ListViewSwitch className="jv-list-header__switch" />
        </div>
        <SearchInput
          label={scope.searchLabel}
          placeholder={t("common.search")}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onClear={() => setInput("")}
        />
      </header>

      <div
        ref={scrollRef}
        className="jv-list"
        aria-live="polite"
        aria-busy={data.isPlaceholderData || undefined}
      >
        {(data.isLoading || scope.isResolving) && <TimelineSkeleton />}

        {(data.isError || scope.isError) && !data.isLoading && (
          <StatusView
            role="alert"
            tone="danger"
            icon={<TriangleAlert size={20} />}
            title={t("timeline.loadError")}
            description={t("timeline.checkConnection")}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void data.refetch();
                  scope.refetch();
                }}
              >
                {t("common.retry")}
              </Button>
            }
          />
        )}

        {!data.isLoading &&
          !data.isError &&
          !scope.isResolving &&
          !scope.isError &&
          !moments.length &&
          (search.q ? (
            <StatusView
              icon={<SearchX size={20} />}
              title={t("timeline.noSearchResults", { query: search.q })}
              description={t("timeline.searchSuggestion")}
              action={
                <Button variant="secondary" onClick={() => setInput("")}>
                  {t("common.clearSearch")}
                </Button>
              }
            />
          ) : (
            <StatusView
              icon={<NotebookPen size={20} />}
              title={scope.emptyTitle}
              description={scope.emptyDescription}
              action={
                canWriteFromEmpty ? (
                  <Button
                    variant="default"
                    nativeButton={false}
                    render={
                      <Link
                        to={
                          scope.kind === "journal"
                            ? "/journals/$journalId/new"
                            : "/timeline/new"
                        }
                        params={
                          scope.kind === "journal" && scope.id
                            ? { journalId: scope.id }
                            : undefined
                        }
                        search={{ q: "" }}
                      />
                    }
                  >
                    {t("timeline.writeFirstEntry")}
                  </Button>
                ) : undefined
              }
            />
          ))}

        {groups.map((group) => (
          <div className="jv-list__group" key={group.key}>
            <h2 className="jv-list__day">{group.label}</h2>
            {group.moments.map((moment) => (
              <MomentListItem
                key={moment.id}
                moment={moment}
                journal={journals.get(moment.entry?.journal_id)}
                journalId={scope.kind === "journal" ? scope.id : undefined}
                scopeSearch={scopeSearch}
                selected={moment.id === params.momentId}
                search={search.q ?? ""}
              />
            ))}
          </div>
        ))}

        {data.hasNextPage && (
          <div className="jv-list__more">
            <Button
              variant="secondary"
              onClick={() => data.fetchNextPage()}
              disabled={data.isFetchingNextPage || data.isPlaceholderData}
            >
              {data.isFetchingNextPage
                ? t("common.loading")
                : t("common.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="jv-list__group"
      role="status"
      aria-label={t("timeline.loadingMoments")}
    >
      <div className="jv-list__day">
        <Skeleton height="0.8rem" width="7rem" />
      </div>
      {["a", "b", "c", "d", "e"].map((key) => (
        <div className="jv-moment jv-moment--skeleton" key={key}>
          <span className="jv-moment__body">
            <Skeleton height="0.75rem" width="4.5rem" />
            <Skeleton height="0.95rem" width="72%" />
            <Skeleton height="0.85rem" width="94%" />
            <Skeleton height="0.85rem" width="60%" />
          </span>
        </div>
      ))}
    </div>
  );
}
