# WebKit Continuous Audio Resume Investigation — Work Log

## Objective

Investigate an iOS/WebKit audio playback bug where a **continuous streaming MP3** (SomaFM) develops an audio glitch after switching away from the stream to another audio source and then returning to it.

The important control experiment is a **finite MP3**, which does not exhibit the same problem after the equivalent playback transition.

Working question:

> What is different about the media pipeline when a continuously advancing stream is interrupted and then resumed?

## 1. Initial Investigation

We attached LLDB to the WebKit GPU process used by the locally built `MobileMiniBrowser`.

The relevant process was:

```text
com.apple.WebKit.GPU
```

An early backtrace showed execution inside:

```text
AVFCore`__avplayeritem_fpItemNotificationCallback_block_invoke
```

The GPU process was also observed being terminated with `SIGKILL` during some debugging attempts. This made process attachment somewhat noisy because the simulator can recycle the WebKit GPU process.

The locally built app is launched with:

```bash
Tools/Scripts/run-webkit-app   --debug   --iphone-simulator   WebKitBuild/Debug-iphonesimulator/MobileMiniBrowser.app
```

We confirmed that the GPU process loads the locally built WebCore:

```text
/Users/randallrouse/Developer/WebKit/WebKitBuild/Debug-iphonesimulator/WebCore.framework/WebCore
```

## 2. AVFoundation Playback State

LLDB breakpoints were placed on:

```cpp
WebCore::MediaPlayerPrivateAVFoundationObjC::playbackBufferEmptyDidChange(bool)
```

and:

```cpp
WebCore::MediaPlayerPrivateAVFoundationObjC::playbackLikelyToKeepUpDidChange(bool)
```

These produced many state transitions.

An important observation was that the player could report:

```text
playbackBufferEmpty = false
playbackLikelyToKeepUp = true
```

while the audio problem was still occurring.

That made a simple "the player ran out of buffered data" explanation less compelling.

## 3. Playback / Rate

Breakpoints were also placed on:

```cpp
WebCore::MediaPlayerPrivateAVFoundationObjC::platformPlay()
```

and:

```cpp
WebCore::MediaPlayerPrivateAVFoundationObjC::rateDidChange(double)
```

We observed playback calls followed by rate changes such as:

```text
PLATFORM_PLAY
RATE_DID_CHANGE
rate = 1
```

and later:

```text
RATE_DID_CHANGE
rate = 0
```

followed by another play/rate transition.

The important conclusion was that WebKit was actually invoking playback and AVFoundation was reporting a playback rate of `1`.

## 4. AVPlayer Time-Control Status

We added a breakpoint to:

```cpp
WebCore::MediaPlayerPrivateAVFoundationObjC::timeControlStatusDidChange(int)
```

Observed values included:

```text
0
1
2
```

with `2` representing the playing state.

The significant observation was that the player eventually reached:

```text
timeControlStatus = 2
```

during the problematic transition.

So the failing resume can occur even when the observable playback state looks healthy:

```text
rate = 1
timeControlStatus = playing
buffer is not empty
likelyToKeepUp = true
```

This shifted the investigation away from a basic "playback did not resume" failure.

## 5. WebKit Source Investigation

We then moved into:

```text
Source/WebCore/platform/graphics/avfoundation/objc/MediaPlayerPrivateAVFoundationObjC.mm
```

Several timing-related fields were found:

```cpp
mutable MediaTime m_cachedCurrentTime { -1, 1, 0 };
mutable MediaTime m_lastPeriodicObserverMediaTime;
mutable Markable<WallTime> m_wallClockAtCachedCurrentTime;
mutable int m_timeControlStatusAtCachedCurrentTime { 0 };
mutable double m_requestedRateAtCachedCurrentTime { 0 };
```

These fields became the basis of the current working hypothesis.

## 6. Timeline / Current-Time Hypothesis

The most interesting discovery was `currentTime()`.

WebKit does not always directly ask AVFoundation for the current time. It can use a cached media time and extrapolate it using wall-clock time:

```cpp
auto itemTime = m_cachedCurrentTime;

if (m_timeControlStatusAtCachedCurrentTime == AVPlayerTimeControlStatusPlaying) {
    auto elapsedMediaTime =
        (WallTime::now() - *m_wallClockAtCachedCurrentTime)
        * m_requestedRateAtCachedCurrentTime;

    itemTime += MediaTime::createWithDouble(elapsedMediaTime.seconds());
}
```

Conceptually:

```text
cached media time
       +
elapsed wall-clock time × playback rate
       =
estimated current media time
```

When WebKit needs a new timing anchor, it asks AVFoundation for the current time:

```cpp
if (!m_wallClockAtCachedCurrentTime)
    currentTimeDidChange(PAL::toMediaTime([m_avPlayerItem currentTime]));
```

`currentTimeDidChange()` then stores a new snapshot:

```cpp
m_cachedCurrentTime = time;
m_wallClockAtCachedCurrentTime = WallTime::now();
m_timeControlStatusAtCachedCurrentTime = m_cachedTimeControlStatus;
m_requestedRateAtCachedCurrentTime = m_requestedRate;
```

This is particularly interesting because a continuously advancing stream may have different timeline behavior from a finite MP3.

## 7. Periodic AVFoundation Time Observer

The source also showed a periodic AVPlayer time observer:

```cpp
m_currentTimeObserver =
    [m_avPlayer addPeriodicTimeObserverForInterval:
        PAL::CMTimeMake(1, 10)
        queue:mainDispatchQueueSingleton()
        usingBlock:...]
```

The observer fires approximately every:

```text
100 ms
```

It converts AVFoundation `CMTime` into WebKit `MediaTime` and eventually calls:

```cpp
currentTimeDidChange(time);
```

WebKit already contains diagnostics for suspicious time behavior, including:

- zero appearing unexpectedly
- negative time
- time moving backwards
- infinite time

In particular, it checks whether:

```cpp
time < m_lastPeriodicObserverMediaTime
```

and logs if the periodic observer goes backwards.

This makes the timing path directly testable.

## 8. Seekable / Live Stream State

We also found that WebKit tracks seekable/live-stream information.

When AVFoundation reports changes, WebKit receives:

```text
seekableRanges
seekableTimeRangesLastModifiedTime
liveUpdateInterval
```

and caches them:

```cpp
m_cachedSeekableRanges = WTF::move(seekableRanges);
m_cachedSeekableTimeRangesLastModifiedTime =
    seekableTimeRangesLastModifiedTime;
m_cachedLiveUpdateInterval = liveUpdateInterval;
```

These values are relevant because the failing case is a continuous stream rather than a finite media file.

However, there is currently **no evidence that `liveUpdateInterval` itself is the cause**. It is being collected as diagnostic information.

## 9. Current Working Model

The strongest current hypothesis is a media-timeline synchronization issue around interruption/resume of continuous media:

```text
Continuous stream
       |
       v
AVPlayer playing normally
       |
       v
Switch to another media source
       |
       v
Continuous stream interrupted/paused
       |
       v
AVPlayer/WebKit state changes
       |
       v
Return to continuous stream
       |
       v
WebKit resumes playback
       |
       +--> rate = 1
       +--> timeControlStatus = playing
       +--> buffer not empty
       +--> likelyToKeepUp = true
       |
       v
??? timeline/current-time synchronization ???
       |
       v
Audio glitch
```

This is a hypothesis, not a confirmed root cause.

Other possibilities remain, including an AVFoundation continuous-stream decoder or audio-rendering issue.

## 10. Instrumentation Added

Rather than continuing to rely entirely on LLDB, four temporary `RRDEBUG` logging points were added to:

```text
MediaPlayerPrivateAVFoundationObjC.mm
```

### Timeline re-anchor

Marker:

```text
RRDEBUG TIMELINE REANCHOR
```

Records:

- AVFoundation current time
- cached current time
- time-control status
- requested rate

### Live ranges

Marker:

```text
RRDEBUG LIVE_RANGES
```

Records:

- seekable range count
- last-modified time
- live-update interval

### Rate

Marker:

```text
RRDEBUG RATE
```

Records:

- old cached rate
- new rate
- requested rate
- requested playing state

### Time-control status

Marker:

```text
RRDEBUG TIME_CONTROL
```

Records:

- old time-control status
- new time-control status
- requested rate
- requested playing state
- whether WebKit is observing time-control status

## 11. Instrumentation Verification

The source was checked with:

```bash
grep -n 'RRDEBUG' Source/WebCore/platform/graphics/avfoundation/objc/MediaPlayerPrivateAVFoundationObjC.mm
```

The four expected markers are present:

```text
RRDEBUG TIMELINE REANCHOR
RRDEBUG LIVE_RANGES
RRDEBUG RATE
RRDEBUG TIME_CONTROL
```

The source diff was also inspected.

## 12. Next Step

The instrumentation has been added, but the instrumented WebKit has **not yet been rebuilt**.

Next command:

```bash
cd ~/Developer/WebKit

Tools/Scripts/build-webkit --debug --ios-simulator
```

Do not clean `WebKitBuild`; this should be an incremental build.

After a successful build:

```bash
Tools/Scripts/run-webkit-app   --debug   --iphone-simulator   WebKitBuild/Debug-iphonesimulator/MobileMiniBrowser.app
```

Then perform one controlled reproduction:

```text
SomaFM
  ↓
Play
  ↓
YouTube
  ↓
Return to SomaFM
  ↓
Resume playback
  ↓
Observe whether the glitch occurs
```

The goal is to correlate the `RRDEBUG` messages with the exact moment the audio becomes corrupted.

## 13. What We Want to Learn

The next experiment should tell us whether the media timeline changes unexpectedly across the transition.

### Potential normal timeline

```text
100.1
100.2
100.3
pause
resume
100.4
100.5
100.6
```

This would weaken the WebKit timeline hypothesis.

### Potential backwards timeline

```text
100.3
pause
resume
72.1
72.2
```

This would strongly suggest a timeline discontinuity.

### Potential reset

```text
100.3
pause
resume
0
0
100.4
```

This would also be significant.

### Potential large jump

```text
100.3
pause
resume
146.8
146.9
```

This could indicate a discontinuity in the continuous stream's media timeline.

### Normal timeline + audio glitch

If timing remains monotonic and sensible while the audio still glitches, the investigation should move further down the stack toward:

```text
AVFoundation
    ↓
continuous MP3 demuxing / decoding
    ↓
audio renderer
```

rather than WebKit's current-time bookkeeping.

## Current Status

**Status:** Investigation in progress.

**Primary hypothesis:** Continuous-stream media timeline synchronization across pause/resume.

**Evidence so far:**

- Continuous stream fails while the finite MP3 control behaves differently.
- AVPlayer reaches the playing state.
- Playback rate reaches `1`.
- Buffer state can report healthy.
- `likelyToKeepUp` can report healthy.
- WebKit maintains cached media time and wall-clock timing state.
- WebKit extrapolates media time while playing.
- WebKit explicitly checks for backwards/invalid periodic media times.
- WebKit tracks seekable/live-stream timing information.

**Evidence still needed:**

- Actual `RRDEBUG` output during the failing reproduction.

**Immediate next action:**

Build the instrumented WebKit and perform one controlled reproduction while collecting the diagnostic logs.
