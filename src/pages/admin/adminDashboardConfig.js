export const ADMIN_CONFIG = {
    Songs: {
        endpoint: 'allSongs',   
        singular: 'Música',    
        plural: 'Songs',       
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Título', accessor: 'title' },
            { header: 'Artista ID', accessor: 'artistId' },
            { header: 'Álbum ID', accessor: 'albumId' },
            { header: 'Duração', accessor: 'duration' },
        ],
    
        formFields: [
            { name: 'title', label: 'Título', type: 'text', required: true },
            { name: 'artistId', label: 'ID do Artista', type: 'text', required: true },
            { name: 'albumId', label: 'ID do Álbum', type: 'text', required: true },
            { name: 'duration', label: 'Duração (ex: 3:45)', type: 'text', required: false },
        ]
    },

    Users: {
        endpoint: 'users',
        singular: 'Usuário',
        plural: 'Users',
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Username', accessor: 'name' },
            { header: 'Email', accessor: 'email' },
            { header: 'Admin?', accessor: 'role' },
        ],
        formFields: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Senha', type: 'password', required: true },
            { name: 'isAdmin', label: 'É Administrador?', type: 'checkbox', required: false },
        ]
    },

    Artists: {
        endpoint: 'topArtists',
        singular: 'Artista',
        plural: 'Artists',
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Name', accessor: 'name' },
            { header: 'Genre', accessor: 'genre' },
        ],
        formFields: [
            { name: 'Name', label: 'Nome', type: 'text', required: true },
            { name: 'genre', label: 'Gênero', type: 'text', required: true },
        ]
    },

    Albums: {
        endpoint: 'topAlbums',   
        singular: 'Álbum',    
        plural: 'Albums',       
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Título', accessor: 'title' },
            { header: 'Artista ID', accessor: 'artistId' },
        ],
    
        formFields: [
            { name: 'title', label: 'Título', type: 'text', required: true },
            { name: 'artistId', label: 'ID do Artista', type: 'text', required: true },
        ]
    },

    Playlists: {
        endpoint: 'userPlaylists',   
        singular: 'Playlist',    
        plural: 'Playlists',       
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Nome', accessor: 'name' },
            { header: 'ID do Criador', accessor: 'creatorId' },
            { header: 'Tipo', accessor: 'type' },
            { header: 'Músicas', accessor: 'songs' },
        ],
    
        formFields: [
            { name: 'name', label: 'Nome', type: 'text', required: true },
            { name: 'userId', label: 'ID do criador', type: 'text', required: true },
        ]
    },

    Groups: {
        endpoint: 'groups',   
        singular: 'Grupo',    
        plural: 'Groups',       
        columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Nome', accessor: 'name' },
            { header: 'Membros', accessor: 'members' || 'type' || 'N/A' },
            { header: 'Status', accessor: 'status' },
        ],
    
        formFields: [
            { name: 'name', label: 'Nome', type: 'text', required: true },
        ]
    },
};