Feature: Spectator Mode
  As a spectator
  I want to watch AI players compete with visible cards
  So that I can learn strategies and enjoy the game

  Background:
    Given a game with 4 AI players
    And spectator mode is enabled
    And the game has been initialized with seed 12345

  @spectator @visible-cards
  Scenario: Spectator can see all AI players' hands
    Given player 1 has cards "7♥, 7♦, 5♣, 9♠, K♥"
    And player 2 has cards "3♥, 4♦, 10♣, J♠, Q♥"
    And player 3 has cards "A♥, 2♦, 8♣, 6♠, 5♥"
    And player 4 has cards "K♦, K♣, 9♥, 3♠, 7♣"
    When the spectator views the game
    Then all 4 players' hands should be visible
    And player 1's cards should show "7♥, 7♦, 5♣, 9♠, K♥"
    And player 2's cards should show "3♥, 4♦, 10♣, J♠, Q♥"
    And player 3's cards should show "A♥, 2♦, 8♣, 6♠, 5♥"
    And player 4's cards should show "K♦, K♣, 9♥, 3♠, 7♣"

  @spectator @cards-update
  Scenario: Spectator sees card changes in real-time
    Given player 1 has 5 cards
    When player 1 plays 2 cards
    Then the spectator should see player 1 now has 3 cards
    And the played cards should animate to the table pile

  @spectator @non-spectator
  Scenario: Human player mode does not reveal opponent cards
    Given a game with 1 human and 3 AI players
    And spectator mode is disabled
    When the human player views the game
    Then only the human player's hand should be visible
    And AI players should show card backs only

  @spectator @victory
  Scenario: Victory is clearly announced in-game
    Given the draw pile is empty
    And player 2 has 2 cards in hand
    When player 2 plays 2 cards with a valid claim
    And no player challenges
    Then a victory overlay should appear
    And the overlay should show "Player 2 Wins!" prominently
    And the winner's avatar and name should be displayed
    And the overlay should remain for 2-3 seconds
    And then transition to the game over screen

  @spectator @victory @animation
  Scenario: Victory announcement has celebration effect
    Given player 1 has won the game
    When the victory overlay appears
    Then confetti or particle effects should animate
    And the winner's cards should be highlighted
    And a victory sound should play (if sounds enabled)

  @spectator @current-player
  Scenario: Current player is clearly indicated
    Given it is player 3's turn
    When the spectator views the game
    Then player 3's slot should have a highlighted border
    And player 3's slot should have a "Current Turn" indicator
    And other players should not have turn indicators

  # Future scenarios (not implemented yet)

  @spectator @play-to-loser @future
  Scenario: Game continues until loser is determined
    Given the draw pile is empty
    And player 1 wins by emptying their hand
    Then player 1 is marked as winner (1st place)
    And the game continues with remaining 3 players
    When player 3 empties their hand
    Then player 3 is marked as 2nd place
    And the game continues with remaining 2 players
    When player 2 empties their hand
    Then player 2 is marked as 3rd place
    And player 4 is the loser (4th place)
    And the game ends with final standings

  @spectator @rankings @future
  Scenario: Final rankings are shown
    Given all players have finished
    Then the game over screen should show:
      | place | player   |
      | 1st   | Player 1 |
      | 2nd   | Player 3 |
      | 3rd   | Player 2 |
      | 4th   | Player 4 |
    And the loser should be clearly marked

