import { Link } from 'react-router-dom'

export default function AlbumHeader( {cover, songCover, type, title, artistImg = "https://placehold.co/30?text=Artist+Img.png", artist, year, duration, artistId, artistLinkPrefix = '/artist/', onPlay, genres}){
    
    const finalCover = cover ? cover : songCover;

    const genresDisplay = Array.isArray(genres) 
        ? genres.join(', ') 
        : genres;

    return (
        <>
            <div className="album-header flex">
                <div className="album-cover">
                    <img src={finalCover} alt="Capa do Álbum/Música" className="album-cover"/>
                </div>
                <div className="album-info flex">
                    <p>{type}</p>
                    <h2 className="album-title">{title}</h2>
                    <div className="album-details flex">

                        <div className="artist-logo-container">
                            <img className="artist-logo" src={artistImg} alt="Logo do Artista"/>
                        </div>
                        <Link to={`${artistLinkPrefix}${artistId}`} className="artist-link">
                            <span>{artist}</span>
                        </Link>
                        
                        {genresDisplay && (
                            <>
                                <span>•</span>
                                <span className='lighter-text'>{genresDisplay}</span>
                            </>
                        )}

                        <span>•</span>
                        <span className='lighter-text'>{year}</span>
                        <span>•</span>
                        <span className='lighter-text'>{duration}</span>

                    </div>
                </div>
            </div>
        </>
    )
}