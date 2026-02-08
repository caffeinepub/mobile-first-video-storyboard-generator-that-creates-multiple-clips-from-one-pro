import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PublicVideoSession {
    owner?: Principal;
    segments: Array<PublicSegment>;
    segmentPrompts: Array<string>;
    perClipDuration: bigint;
    originalPrompt: string;
}
export type Time = bigint;
export interface VideoSessionSummary {
    id: VideoSessionId;
    owner?: Principal;
    segmentCount: bigint;
    createdAt: Time;
    originalPrompt: string;
}
export type VideoSessionId = bigint;
export type Status = {
    __kind__: "generating";
    generating: null;
} | {
    __kind__: "completed";
    completed: null;
} | {
    __kind__: "queued";
    queued: null;
} | {
    __kind__: "failed";
    failed: string;
};
export interface PublicSegment {
    status: Status;
    prompt: string;
}
export interface backendInterface {
    createSession(originalPrompt: string, segmentPrompts: Array<string>, perClipDuration: bigint): Promise<VideoSessionId>;
    getSession(sessionId: VideoSessionId): Promise<PublicVideoSession>;
    getUserSessions(user: Principal): Promise<Array<VideoSessionSummary>>;
    updateSegmentStatus(sessionId: VideoSessionId, segmentId: bigint, newStatus: Status): Promise<void>;
}
