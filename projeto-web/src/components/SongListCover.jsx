import React from 'react';

const TrackItem = ({ track, index }) => {
    const duration = '3:45'; 
    const plays = '2.567.890.123';
    
    return (
        <div className="grid grid-cols-5 items-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <div className="col-span-1 text-zinc-400 text-sm">{index + 1}</div>

            <div className="col-span-2 flex items-center gap-3">
                <img src={track.cover} alt={track.title} className="w-10 h-10 rounded" />
                <div className="flex flex-col">
                    <span className="text-white font-medium">{track.title}</span>
                    <span className="text-zinc-400 text-xs">{track.artist}</span>
                </div>
            </div>

            <div className="col-span-1 text-zinc-400 text-sm">{plays}</div>
            <div className="col-span-1 text-zinc-400 text-sm text-right">{duration}</div>
        </div>
    );
}

const ArtistMusicList = ({ tracks }) => {
  if (!tracks || tracks.length === 0) {
    return <p className="text-zinc-400">Nenhuma música popular para exibir.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tracks.slice(0, 5).map((track, index) => (
        <TrackItem key={track.id} track={track} index={index} />
      ))}
    </div>
  );
};

export default ArtistMusicList;
