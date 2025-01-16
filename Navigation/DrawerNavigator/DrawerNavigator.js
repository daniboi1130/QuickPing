// External imports
import { 
    createDrawerNavigator, 
    DrawerContentScrollView, 
    DrawerItem 
} from "@react-navigation/drawer";
import { Text } from "react-native";

// Screen imports
import Login from "../../screens/Login";
import Register from "../../screens/Register";
import MessageEditorPage from "../../screens/MessageEditorPage";
import ContactsEditor from "../../screens/ContactsEditorPage";

// Styles and theme
import styles from "./DrawerNavigator.styles";
import HomeScreen from "../../screens/HomeScreen";

// Initialize drawer navigator
const Drawer = createDrawerNavigator();

// Screen configuration
const DRAWER_SCREENS = [
    
    {
        key: "HomeScreen",
        component: HomeScreen,

    },
    {
        key: "Login",      
        component: Login,
    },
    {
        key: "Register",      
        component: Register,
    },
    {
        key: "Message Editor",
        component: MessageEditorPage,
    },
    {
        key: "Contacts Editor",      
        component: ContactsEditor,
    }
];

/**
 * DrawerNavigator Component
 * Implements a custom drawer navigation with right-to-left support
 * 
 * Features:
 * - Right-side drawer
 * - Custom styling
 * - No default headers
 * - Custom drawer content
 */
const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            initialRouteName="HomeScreen"
            screenOptions={{
                drawerPosition: "right",
                headerShown: false,
                drawerStyle: {
                    backgroundColor: 'white',
                    width: "65%",
                },
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
            {DRAWER_SCREENS.map((screen) => (
                <Drawer.Screen 
                    key={screen.key} 
                    name={screen.key} 
                    component={screen.component} 
                />
            ))}
        </Drawer.Navigator>
    );
};

/**
 * CustomDrawerContent Component
 * Renders the content of the drawer menu
 * 
 * @param {Object} props - Navigation props from drawer
 */
const CustomDrawerContent = (props) => {
    const { routes, index } = props.state;
    const focused = routes[index];

    return (
        <DrawerContentScrollView {...props}>
            <Text style={styles.appName}>QuickPing</Text>
            {DRAWER_SCREENS.map((screen) => (
                <DrawerItem
                    key={screen.key}
                    label={screen.key}
                    onPress={() => props.navigation.navigate(screen.key)}
                    focused={focused.name === screen.key}
                    activeBackgroundColor="#fee0e1"
                    activeTintColor="#ff6163"
                />
            ))}
        </DrawerContentScrollView>
    );
};

export default DrawerNavigator;