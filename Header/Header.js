// External imports
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

// Styles
import styles from "./Header.styles";

/**
 * Header Component
 * Displays a navigation header with back button, title, and drawer menu
 *
 * @param {string} title - The title to display in the header
 * @param {boolean} noBack - Whether to hide the back button
 */
const Header = ({ title, noBack }) => {
    // Hooks
    const navigation = useNavigation();

    // Navigation handlers
    const handleBackPress = () => navigation.goBack();
    const handleDrawerToggle = () => navigation.dispatch(DrawerActions.toggleDrawer());

    // Render
    return (
        <View style={styles.background}>
            <View style={styles.top}>
                {/* Back Button or empty space */}
                {noBack ? (
                    <View style={styles.leftIcon} />
                ) : (
                    <TouchableOpacity 
                        style={styles.leftIcon} 
                        onPress={handleBackPress}
                    >
                        <Icon name="arrow-back" size={38} color="black" />
                    </TouchableOpacity>
                )}

                {/* Header Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Drawer Menu Button */}
                <TouchableOpacity 
                    style={styles.rightIcon} 
                    onPress={handleDrawerToggle}
                >
                    <Icon name="menu" size={38} color="black" />
                </TouchableOpacity>
            </View>

            {/* Divider Line */}
            <View style={styles.horizontalRule} />
        </View>
    );
};

export default Header;