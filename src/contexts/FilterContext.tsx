"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

export interface FilterContextValue {
  search: string;
  setSearch: (val: string) => void;
  filterCampaign: string;
  setFilterCampaign: (val: string) => void;
  filterChannel: string;
  setFilterChannel: (val: string) => void;
  filterPlatform: string;
  setFilterPlatform: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterOwner: string;
  setFilterOwner: (val: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  campaigns: Array<{ id: string; name: string; status?: string }>;
  channels: Array<{ id: string; name: string; platform?: string }>;
  teammates: Array<{ userId: string; name?: string; displayName?: string; role?: string }>;
  refreshFilterData: () => Promise<void>;
  setFilterContextData: (data: {
    campaigns?: any[];
    channels?: any[];
    teammates?: any[];
  }) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwner, setFilterOwner] = useState("");

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [teammates, setTeammates] = useState<any[]>([]);

  const fetchFilterData = useCallback(async () => {
    try {
      const [campRes, chanRes, teamRes] = await Promise.allSettled([
        fetch("/api/campaigns").then((r) => r.json()),
        fetch("/api/channels").then((r) => r.json()),
        fetch("/api/team/members").then((r) => r.json()),
      ]);

      if (campRes.status === "fulfilled" && campRes.value?.campaigns) {
        setCampaigns(campRes.value.campaigns);
      }
      if (chanRes.status === "fulfilled" && chanRes.value?.channels) {
        setChannels(chanRes.value.channels);
      }
      if (teamRes.status === "fulfilled" && teamRes.value?.members) {
        setTeammates(teamRes.value.members);
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  const setFilterContextData = useCallback(
    (data: { campaigns?: any[]; channels?: any[]; teammates?: any[] }) => {
      if (data.campaigns) setCampaigns(data.campaigns);
      if (data.channels) setChannels(data.channels);
      if (data.teammates) setTeammates(data.teammates);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilterCampaign("");
    setFilterChannel("");
    setFilterPlatform("");
    setFilterStatus("");
    setFilterOwner("");
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCampaign) count++;
    if (filterChannel) count++;
    if (filterPlatform) count++;
    if (filterStatus) count++;
    if (filterOwner) count++;
    return count;
  }, [filterCampaign, filterChannel, filterPlatform, filterStatus, filterOwner]);

  return (
    <FilterContext.Provider
      value={{
        search,
        setSearch,
        filterCampaign,
        setFilterCampaign,
        filterChannel,
        setFilterChannel,
        filterPlatform,
        setFilterPlatform,
        filterStatus,
        setFilterStatus,
        filterOwner,
        setFilterOwner,
        resetFilters,
        activeFilterCount,
        campaigns,
        channels,
        teammates,
        refreshFilterData: fetchFilterData,
        setFilterContextData,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}
