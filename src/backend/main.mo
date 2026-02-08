import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

actor {
  let MAX_CLIP_DURATION_SECONDS = 120;

  type Status = {
    #queued;
    #generating;
    #completed;
    #failed : Text;
  };

  type Segment = {
    prompt : Text;
    status : Status;
    id : Nat;
  };

  type VideoSessionId = Nat;

  type VideoSession = {
    owner : ?Principal;
    originalPrompt : Text;
    segmentPrompts : [Text];
    perClipDuration : Nat;
    segments : [Segment];
    id : VideoSessionId;
    createdAt : Time.Time;
  };

  module VideoSession {
    public func toPublic(session : VideoSession) : PublicVideoSession {
      {
        owner = session.owner;
        originalPrompt = session.originalPrompt;
        segmentPrompts = session.segmentPrompts;
        perClipDuration = session.perClipDuration;
        segments = Array.tabulate(session.segments.size(), func(i) { toPublicSegment(session.segments[i]) });
      };
    };
  };

  type PublicSegment = {
    prompt : Text;
    status : Status;
  };

  func toPublicSegment(segment : Segment) : PublicSegment {
    {
      prompt = segment.prompt;
      status = segment.status;
    };
  };

  type PublicVideoSession = {
    owner : ?Principal;
    originalPrompt : Text;
    segmentPrompts : [Text];
    perClipDuration : Nat;
    segments : [PublicSegment];
  };

  var nextSessionId = 1;
  var nextSegmentId = 1;
  let sessions = Map.empty<VideoSessionId, VideoSession>();

  type VideoSessionSummary = {
    id : VideoSessionId;
    owner : ?Principal;
    originalPrompt : Text;
    createdAt : Time.Time;
    segmentCount : Nat;
  };

  public shared ({ caller }) func createSession(originalPrompt : Text, segmentPrompts : [Text], perClipDuration : Nat) : async VideoSessionId {
    if (originalPrompt == "") {
      Runtime.trap("Original prompt cannot be empty");
    };

    if (segmentPrompts.isEmpty()) {
      Runtime.trap("At least one segment prompt is required");
    };

    if (perClipDuration == 0 or perClipDuration > MAX_CLIP_DURATION_SECONDS) {
      Runtime.trap("Clip duration must be between 1 and 120 seconds");
    };

    let segments = segmentPrompts.map(
      func(prompt) {
        let segment = {
          prompt;
          status = #queued : Status;
          id = nextSegmentId;
        };
        nextSegmentId += 1;
        segment;
      }
    );

    let session = {
      owner = ?caller;
      originalPrompt;
      segmentPrompts;
      perClipDuration;
      segments;
      id = nextSessionId;
      createdAt = Time.now();
    };

    let sessionId = nextSessionId;
    nextSessionId += 1;

    sessions.add(sessionId, session);
    sessionId;
  };

  public query ({ caller }) func getSession(sessionId : VideoSessionId) : async PublicVideoSession {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) { VideoSession.toPublic(session) };
    };
  };

  public query ({ caller }) func getUserSessions(user : Principal) : async [VideoSessionSummary] {
    sessions.values().filter(
      func(session) {
        switch (session.owner) {
          case (?owner) { owner == user };
          case (null) { false };
        };
      }
    ).toArray().map(
      func(s) {
        {
          id = s.id;
          owner = s.owner;
          originalPrompt = s.originalPrompt;
          createdAt = s.createdAt;
          segmentCount = s.segmentPrompts.size();
        };
      }
    );
  };

  public shared ({ caller }) func updateSegmentStatus(sessionId : VideoSessionId, segmentId : Nat, newStatus : Status) : async () {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) {
        let updatedSegments = session.segments.map(
          func(seg) {
            if (seg.id == segmentId) {
              {
                prompt = seg.prompt;
                status = newStatus;
                id = seg.id;
              };
            } else { seg };
          }
        );
        let updatedSession = {
          owner = session.owner;
          originalPrompt = session.originalPrompt;
          segmentPrompts = session.segmentPrompts;
          perClipDuration = session.perClipDuration;
          segments = updatedSegments;
          id = session.id;
          createdAt = session.createdAt;
        };
        sessions.add(sessionId, updatedSession);
      };
    };
  };
};
