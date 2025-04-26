/**
 * External imports from React and React Native libraries
 * Required for basic component functionality and navigation
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

/**
 * Internal imports
 * Styles for the Header component
 */
import styles from "./Header.styles";

/**
 * Header Component
 * Renders a navigation header with customizable back button, title, and hamburger menu
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - The text to display in the header center
 * @param {boolean} [props.noBack=false] - If true, hides the back button
 * @param {boolean} [props.noHamburger=false] - If true, hides the hamburger menu
 * @returns {React.ReactElement} Rendered Header component
 */
const Header = ({ title, noBack, noHamburger }) => {
    /**
     * Navigation hook for handling routing actions
     * @constant {Object} navigation - Navigation object from React Navigation
     */
    const navigation = useNavigation();

    /**
     * Handles the back button press event
     * Navigates to the previous screen in the stack
     * @function
     * @returns {void}
     */
    const handleBackPress = () => {
        navigation.goBack();
    };

    /**
     * Handles the drawer toggle event
     * Opens or closes the navigation drawer
     * @function
     * @returns {void}
     */
    const handleDrawerToggle = () => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    };

    return (
        <View style={styles.background}>
            <View style={styles.top}>
                {/* Back Button Section */}
                {noBack ? (
                    <View style={styles.leftIcon} />
                ) : (
                    <TouchableOpacity 
                        style={styles.leftIcon} 
                        onPress={handleBackPress}
                    >
                        <Icon 
                            name="arrow-back" 
                            size={38} 
                            color="black" 
                        />
                    </TouchableOpacity>
                )}

                {/* Title Section */}
                <Text style={styles.title}>
                    {title}
                </Text>

                {/* Hamburger Menu Section */}
                {noHamburger ? (
                    <View style={styles.leftIcon} />
                ) : (
                    <TouchableOpacity 
                        style={styles.rightIcon} 
                        onPress={handleDrawerToggle}
                    >
                        <Icon 
                            name="menu" 
                            size={38} 
                            color="black" 
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Divider */}
            <View style={styles.horizontalRule} />
        </View>
    );
};

export default Header;