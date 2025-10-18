import React from 'react'
import Song from './Song'

const tracksData = [
    {
      cover: "https://placehold.co/600x600",
      title: "Houdini",
      artist: "Dua Lipa",
      id: "song-01",
      artistId: "artist-01",
      duration: "3:05",
      releaseDate: "2023-11-09T00:00:00.000Z",
      recordLabel: "Warner Records",
      caminho: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      lyrics: "Okay, huh\nMm, ah\nI come and I go\nTell me all the ways you need me\nI'm not here for long\nCatch me or I go Houdini\nI come and I go\nProve you got the right to please me\nEverybody knows\nCatch me or I go Houdini\nTime is passin' like a solar eclipse\nSee you watchin' and you blow me a kiss\nIt's your moment, baby, don't let it slip\nCome in closer, are you readin' my lips?\nThey say I come and I go\nTell me all the ways you need me\nI'm not here for long\nCatch me or I go Houdini\nI come and I go\nProve you got the right to please me\nEverybody knows\nCatch me or I go Houdini\nIf you're good enough, you'll find a way\nMaybe you could cause a girl to change (her ways)\nDo you think about it night and day?\nMaybe you could be the one to make me stay\nEverything you say is soundin' so sweet (ah-ah)\nBut do you practise everything that you preach? (Ah-ah)\nI need something that'll make me believe (ah-ah)\nIf you got it, baby, give it to me\nThey say I come and I go\nTell me all the ways you need me\nI'm not here for long\nCatch me or I go Houdini\nI come and I go (I come and I go)\nProve you got the right to please me\nEverybody knows (I'm not here for long)\nCatch me or I go Houdini\nIf you're good enough, you'll find a way\nMaybe you could cause a girl to change (her ways)\nDo you think about it night and day?\nMaybe you could be the one to make me stay\nOh\nOoh\nI come and I go\nTell me all the ways you need me (ooh)\nI'm not here for long\nCatch me or I go Houdini\nI come and I go (I come and I go)\nProve you got the right to please me\nEverybody knows (I'm not here for long)\nCatch me or I go Houdini\nHoudini (ah)\nCatch me or I go Houdini"
    },
    {
      cover: "https://placehold.co/600x600",
      title: "Espresso",
      artist: "Sabrina Carpenter",
      id: "song-02",
      artistId: "artist-11",
      duration: "2:55",
      releaseDate: "2024-04-11T00:00:00.000Z",
      recordLabel: "Island Records",
      caminho: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      lyrics: "Now he's thinkin' 'bout me every night, oh\nIs it that sweet? I guess so\nSay you can't sleep, baby, I know\nThat's that me espresso\nMove it up, down, left, right, oh\nSwitch it up like Nintendo\nSay you can't sleep, baby, I know\nThat's that me espresso\nI can't relate to desperation\nMy give-a-fucks are on vacation\nAnd I got this one boy, and he won't stop callin'\nWhen they act this way, I know I got 'em\nToo bad your ex don't do it for ya\nWalked in and dream-came-trued it for ya\nSoft skin and I perfumed it for ya\n(Yes) I know, I Mountain Dew it for ya\n(Yes) that morning coffee, brewed it for ya\n(Yes) one touch and I brand-newed it for ya (oh)\nNow he's thinkin' 'bout me every night, oh\nIs it that sweet? I guess so\nSay you can't sleep, baby, I know\nThat's that me espresso\nMove it up, down, left, right, oh\nSwitch it up like Nintendo\nSay you can't sleep, baby, I know\nThat's that me espresso\nHoly shit\nIs it that sweet? I guess so\nI'm working late, 'cause I'm a singer\nOh, he looks so cute wrapped 'round my finger\nMy twisted humor makes him laugh so often\nMy honey bee, come and get this pollen\nToo bad your ex don't do it for ya\nWalked in and dream-came-trued it for ya\nSoft skin and I perfumed it for ya\n(Yes) I know, I Mountain Dew it for ya\n(Yes) that morning coffee, brewed it for ya\n(Yes) one touch and I brand-newed it for ya (stupid)\nNow he's thinkin' 'bout me every night, oh\nIs it that sweet? I guess so\nSay you can't sleep, baby, I know\nThat's that me espresso\nMove it up, down, left, right, oh\nSwitch it up like Nintendo\nSay you can't sleep, baby, I know\nThat's that me espresso\nThinkin' 'bout me every night, oh\nIs it that sweet? I guess so (yes)\nSay you can't sleep, baby, I know\nThat's that me espresso (yes)\nMove it up, down, left, right, oh\nSwitch it up like Nintendo (yes)\nSay you can't sleep, baby, I know\nThat's that me espresso\nIs it that sweet? I guess so, uh\nThat's that me espresso"
    },
    {
      cover: "https://placehold.co/600x600",
      title: "Cruel Summer",
      artist: "Taylor Swift",
      id: "song-03",
      artistId: "artist-02",
      duration: "2:58",
      releaseDate: "2019-08-23T00:00:00.000Z",
      recordLabel: "Republic Records",
      caminho: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      lyrics: "Fever dream high in the quiet of the night\nYou know that I caught it (oh yeah, you're right, I want it)\nBad, bad boy, shiny toy with a price\nYou know that I bought it (oh yeah, you're right, I want it)\nKilling me slow, out the window\nI'm always waiting for you to be waiting below\nDevils roll the dice, angels roll their eyes\nWhat doesn't kill me makes me want you more\nAnd it's new, the shape of your body\nIt's blue, the feeling I've got\nAnd it's ooh, whoa-oh\nIt's a cruel summer\n'It's cool, ' that's what I tell 'em\nNo rules in breakable heaven\nBut ooh, whoa-oh\nIt's a cruel summer with you (yeah, yeah)\nHang your head low in the glow of the vending machine\nI'm not dying (oh yeah, you're right, I want it)\nYou say that we'll just screw it up in these trying times\nWe're not trying (oh yeah, you're right, I want it)\nSo cut the headlights, summer's a knife\nI'm always waiting for you just to cut to the bone\nDevils roll the dice, angels roll their eyes\nAnd if I bleed, you'll be the last to know, oh\nIt's new, the shape of your body\nIt's blue, the feeling I've got\nAnd it's ooh, whoa-oh\nIt's a cruel summer\n'It's cool, ' that's what I tell 'em\nNo rules in breakable heaven\nBut ooh, whoa-oh\nIt's a cruel summer with you\nI'm drunk in the back of the car\nAnd I cried like a baby coming home from the bar (oh)\nSaid, 'I'm fine, ' but it wasn't true\nI don't wanna keep secrets just to keep you\nAnd I snuck in through the garden gate\nEvery night that summer, just to seal my fate (oh)\nAnd I screamed, 'For whatever it's worth\nI love you, ain't that the worst thing you ever heard?'\nHe looks up, grinnin' like a devil\nIt's new, the shape of your body\nIt's blue, the feeling I've got\nAnd it's ooh, whoa-oh\nIt's a cruel summer\n'It's cool, ' that's what I tell 'em\nNo rules in breakable heaven\nBut ooh, whoa-oh\nIt's a cruel summer with you\nI'm drunk in the back of the car\nAnd I cried like a baby coming home from the bar (oh)\nSaid, 'I'm fine, ' but it wasn't true\nI don't wanna keep secrets just to keep you\nAnd I snuck in through the garden gate\nEvery night that summer, just to seal my fate (oh)\nAnd I screamed, 'For whatever it's worth\nI love you, ain't that the worst thing you ever heard?'\n(Yeah, yeah, yeah, yeah)"
    },
    {
      cover: "https://placehold.co/600x600",
      title: "Flowers",
      artist: "Miley Cyrus",
      id: "song-04",
      artistId: "artist-12",
      duration: "3:20",
      releaseDate: "2023-01-12T00:00:00.000Z",
      recordLabel: "Columbia Records",
      caminho: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      lyrics: "We were good, we were gold\nKinda dream that can't be sold\nWe were right 'til we weren't\nBuilt a home and watched it burn\nMm, I didn't wanna leave you, I didn't wanna lie\nStarted to cry, but then remembered I\nI can buy myself flowers\nWrite my name in the sand\nTalk to myself for hours\nSay things you don't understand\nI can take myself dancing\nAnd I can hold my own hand\nYeah, I can love me better than you can\nCan love me better, I can love me better, baby\nCan love me better, I can love me better, baby\nPaint my nails cherry red\nMatch the roses that you left\nNo remorse, no regret\nI forgive every word you said\nOoh, I didn't wanna leave you, baby, I didn't wanna fight\nStarted to cry, but then remembered I\nI can buy myself flowers\nWrite my name in the sand\nTalk to myself for hours, yeah\nSay things you don't understand\nI can take myself dancing, yeah\nI can hold my own hand\nYeah, I can love me better than you can\nCan love me better, I can love me better, baby\nCan love me better, I can love me better, baby\nCan love me better, I can love me better, baby\nCan love me better, I- (ooh, I)\nI didn't wanna leave you, I didn't wanna fight\nStarted to cry, but then remembered I\nI can buy myself flowers (uh-huh)\nWrite my name in the sand\nTalk to myself for hours (yeah)\nSay things you don't understand (you never will)\nI can take myself dancing, yeah\nI can hold my own hand\nYeah, I can love me better than\nYeah, I can love me better than you can\nCan love me better, I can love me better, baby (oh, oh)\nCan love me better, I can love me better, baby (than you can)\nCan love me better, I can love me better, baby\nCan love me better, I-"
    },
    {
      cover: "https://placehold.co/600x600",
      title: "Blinding Lights",
      artist: "The Weeknd",
      id: "song-05",
      artistId: "artist-03",
      duration: "3:20",
      releaseDate: "2019-11-29T00:00:00.000Z",
      recordLabel: "XO / Republic Records",
      caminho: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      lyrics: "I've been tryna call\nI've been on my own for long enough\nMaybe you can show me how to love, maybe\nI'm goin' through withdrawals\nYou don't even have to do too much\nYou can turn me on with just a touch, baby\nI look around and\nSin City's cold and empty (oh)\nNo one's around to judge me (oh)\nI can't see clearly when you're gone\nI said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch\nI said, ooh, I'm drowning in the night\nOh, when I'm like this, you're the one I trust\n(Hey, hey, hey)\nI'm running out of time\n'Cause I can see the sun light up the sky\nSo I hit the road in overdrive, baby, oh\nThe city's cold and empty (oh)\nNo one's around to judge me (oh)\nI can't see clearly when you're gone\nI said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch\nI said, ooh, I'm drowning in the night\nOh, when I'm like this, you're the one I trust\nI'm just walking by to let you know (by to let you know)\nI could never say it on the phone (say it on the phone)\nWill never let you go this time (ooh)\nI said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch\n(Hey, hey, hey)\n(Hey, hey, hey)\nI said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch"
    }];

export default function SongList( {tituloDaSecao = '', tracksArr = tracksData} ) {

    return (
        <div className="mais-tocadas">
            <h3>{tituloDaSecao}</h3>
            
            {tracksArr.map((song) => (
                <div 
                    key={song.id || song.rank}
                    className="song-wrapper"
                >
                    <Song 
                        rank={song.rank}
                        song={song} 
                        coverUrl={song.coverUrl || song.cover}
                        title={song.title}
                        artist={song.artist}
                        album={song.album}
                        duration={song.duration}
                    />
                </div>
            ))}
        </div>
    );
}