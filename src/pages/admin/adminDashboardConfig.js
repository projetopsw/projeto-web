export const ADMIN_CONFIG = {
    Songs: {
        endpoint: 'songs',   
        singular: 'Música',    
        plural: 'Songs',       
        columns: [
            { header: 'ID', accessor: '_id' }, 
            { header: 'Título', accessor: 'title' },
            { header: 'Artista', accessor: 'artists' },
            { header: 'Álbum', accessor: 'album' },
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
            { header: 'ID', accessor: '_id' }, 
            { header: 'Username', accessor: 'username' },
            { header: 'Email', accessor: 'email' },
            { header: 'Role', accessor: 'role' },
        ],
        formFields: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Senha', type: 'password', required: true },
            { name: 'isAdmin', label: 'É Administrador?', type: 'checkbox', required: false },
        ]
    },

    Artists: {
        endpoint: 'artists',
        singular: 'Artista',
        plural: 'Artists',
        columns: [
            { header: 'ID', accessor: '_id' }, 
            { header: 'Name', accessor: 'name' },
            { header: 'Genre', accessor: 'genres' },
        ],
        formFields: [
            { name: 'name', label: 'Nome', type: 'text', required: true }, 
            { name: 'genre', label: 'Gênero', type: 'text', required: true },
        ]
    },

    Albums: {
        endpoint: 'albums',   
        singular: 'Álbum',    
        plural: 'Albums',       
        columns: [
            { header: 'ID', accessor: '_id' },
            { header: 'Título', accessor: 'title' },
            { header: 'Artista', accessor: 'artists' },
        ],
    
        formFields: [
            { name: 'title', label: 'Título', type: 'text', required: true },
            { name: 'artistId', label: 'ID do Artista', type: 'text', required: true },
        ]
    },

    Playlists: {
        endpoint: 'playlists', 
        singular: 'Playlist',    
        plural: 'Playlists',       
        columns: [
            { header: 'ID', accessor: '_id' }, 
            { header: 'Nome', accessor: 'name' },
            { header: 'ID do Criador', accessor: 'userId' }, 
            { header: 'Músicas', accessor: 'songs' },
        ],
    
        formFields: [
            { name: 'name', label: 'Nome', type: 'text', required: true },
            { name: 'userId', label: 'ID do criador', type: 'text', required: true },
        ]
    },
};