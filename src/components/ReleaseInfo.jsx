export default function ReleaseInfo( {releaseDate, recordLabel} ) {
    return (
        <div className="release-info">
            <span className='lighter-text'>{new Date(releaseDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className='lighter-text'>© {new Date(releaseDate).getFullYear()} {recordLabel || "Sua Gravadora"}</span>
        </div>
    )
}