// External imports
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from 'expo-status-bar';

import Login from "../../screens/Login";
import Register from "../../screens/Register";
// Context imports

// Screen components
import DrawerNavigator from "../DrawerNavigator/DrawerNavigator";

// Initialize navigation stack
const Stack = createNativeStackNavigator();

/**
 * MainContent Component
 * Main navigation container that wraps the app's navigation structure
 * Provides shopping list context to all child components
 * 
 * @returns {JSX.Element} The main navigation structure of the app
 */
const StackNavigator = () => {
    return (
       
            <NavigationContainer>
                <StatusBar style="auto" />
                <Stack.Navigator 
                    style={{ layoutDirection: "ltr" }} 
                    initialRouteName="Drawer"
                >
                    {/* Main drawer navigation */}
                    <Stack.Screen
                        name="Drawer"
                        component={DrawerNavigator}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Login"
                        component={Login}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={Register}
                        options={{ headerShown: false }}
                    />

                </Stack.Navigator>
            </NavigationContainer>
        
    );
};

export default StackNavigator;