import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function PodcastPlayer() {
  return (
    <div className="player_controls">
      <AudioPlayer
        src="https://geohabari-pod.s3.us-east-2.amazonaws.com/episodes/episode1.mp3"

      />
    </div>
  );
}
