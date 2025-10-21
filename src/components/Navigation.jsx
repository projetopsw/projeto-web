
import '../pages/home/Home.css'; 

const Navigation = ( {navItemsData, selectedItem, setSelectedItem } ) => {


  return (
    <nav className="home-navigation">
      {navItemsData.map((item) => (
        <div
          key={item}
          className={`nav-item ${selectedItem === item ? 'selected' : ''}`}
          onClick={() => setSelectedItem(item)}
        >
          {item}
        </div>
      ))}
    </nav>
  );
};

export default Navigation;