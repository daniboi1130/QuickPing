// External imports
import { 
    createDrawerNavigator, 
    DrawerContentScrollView, 
    DrawerItem 
} from "@react-navigation/drawer";
import { Text } from "react-native";
import { auth } from "../../Firebase/Config";
import { signOut } from "firebase/auth";

// Screen imports

import MessageEditorPage from "../../screens/MessageEditorPage";
import ContactsEditor from "../../screens/ContactsEditorPage";
import ChooseActivityPage from "../../screens/ChooseActivityPage";
import ContactListPage from "../../screens/ListEditing/ContactListPage";
import SendMessage from "../../screens/SendMessage/SendMessage";
import styles from "./DrawerNavigator.styles";
import HomeScreen from "../../screens/HomeScreen";
import TagEditPage from "../../screens/TagEditPage";

// Initialize drawer navigator
const Drawer = createDrawerNavigator();

// Screen configuration
const DRAWER_SCREENS = [
    
    {
        key: "HomeScreen",
        component: HomeScreen,

    },
    {
        key: "MessageEditor",
        component: MessageEditorPage,
    },
    {
        key: "ContactsEditor",      
        component: ContactsEditor,
    },
    {
        key: "ChooseActivity",
        component: ChooseActivityPage,
    },
    {
        key: "ContactList",
        component: ContactListPage,
    },
    {
        key: "SendMessage",
        component: SendMessage,
    },
    {
        key: "EditTags",
        component: TagEditPage,
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
        <Drawer.Navigator backBehavior="history"
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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            props.navigation.navigate('HomeScreen');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

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
            
            {/* Add Logout Button */}
            <DrawerItem
                label="Logout"
                onPress={handleLogout}
                activeBackgroundColor="#fee0e1"
                activeTintColor="#ff6163"
                style={{ marginTop: 20 }}
            />
        </DrawerContentScrollView>
    );
};

export default DrawerNavigator;