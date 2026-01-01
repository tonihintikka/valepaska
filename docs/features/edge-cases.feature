Feature: Edge Cases
  As a game engine
  I need to handle edge cases correctly
  So that the game is fair and bug-free

  Background:
    Given a game with 4 players
    And the game has been initialized with seed 12345

  @edge @challenge-burn
  Scenario: Challenge on burn claim (10) - claim was true
    Given the table pile has 10 cards
    When player 1 plays 2 cards "10♥, 10♦" claiming rank "10"
    And player 2 challenges
    And the claim was true
    Then player 2 should NOT pick up cards (pile is burned)
    And the table pile should be burned
    And player 1 should continue

  @edge @challenge-burn
  Scenario: Challenge on burn claim (A) - claim was a lie
    Given the table pile has 10 cards
    When player 1 plays 2 cards "3♥, 4♦" claiming rank "A"
    And player 2 challenges
    And the claim was a lie
    Then the table pile should NOT burn
    And player 1 should pick up 12 cards

  @edge @challenge-burn
  Scenario: Challenge on potential four-in-row trigger
    Given the claim history has 3 consecutive "7" claims
    And the table pile has 15 cards
    When player 4 plays 1 card "3♥" claiming rank "7"
    And player 1 challenges
    And the claim was a lie
    Then the four-in-row should NOT trigger
    And the table pile should NOT burn
    And player 4 should pick up 16 cards
    And the claim history should not count this false claim

  @edge @endgame-challenge
  Scenario: Final play challenged before win confirmed
    Given the draw pile is empty
    And player 1 has 1 card in hand
    And the table pile has 5 cards
    When player 1 plays 1 card "A♥" claiming rank "A"
    And the challenge window opens
    Then all players should have the opportunity to challenge
    And the win should not be confirmed until challenge window closes

  @edge @endgame-challenge-lie
  Scenario: Final play was a lie - game continues
    Given the draw pile is empty
    And player 1 has 1 card in hand
    And player 2 has 3 cards in hand
    And the table pile has 5 cards
    When player 1 plays 1 card "3♥" claiming rank "A"
    And player 2 challenges
    And the claim was a lie
    Then player 1 should pick up 6 cards
    And player 1 should have 6 cards
    And player 1 should NOT win
    And the game should continue with player 2

  @edge @four-in-row-reset
  Scenario: Four-in-row counter resets after lie detected
    Given the claim history is:
      | rank | count | accepted |
      | 7    | 1     | true     |
      | 7    | 2     | true     |
    When player 3 plays 1 card "3♥" claiming rank "7"
    And player 4 challenges
    And the claim was a lie
    Then the four-in-row counter for "7" should reset to 2
    And player 4's next "7" claim should NOT trigger burn

  @edge @two-rule-after-burn
  Scenario: 2 rule does not persist after burn
    Given the last claim was rank "2"
    And the table pile has 10 cards
    When player 1 plays 1 card claiming rank "A"
    And the table burns
    Then player 1 can claim any rank
    And the 2-restriction should be cleared

  @edge @empty-draw-pile-transition
  Scenario: Transition to endgame is smooth
    Given the draw pile has 2 cards
    And player 1 has 5 cards in hand
    When player 1 plays 3 cards
    And no player challenges
    Then player 1 should draw 2 cards
    And player 1 should have 4 cards in hand
    And the game should now be in endgame mode

  @edge @multiple-winners-impossible
  Scenario: Only one winner even with simultaneous empty hands
    Given the draw pile is empty
    And player 1 has 2 cards
    And player 2 has 2 cards
    When player 1 plays 2 cards
    And no player challenges
    Then player 1 wins
    And player 2 does not get a chance to play

  @edge @burn-continuation
  Scenario: Burn gives continuation even in endgame
    Given the draw pile is empty
    And player 1 has 4 cards in hand
    When player 1 plays 2 cards "10♥, 10♦" claiming rank "10"
    And no player challenges
    Then the table burns
    And player 1 should continue with 2 remaining cards
    And player 1 can make another play

  @edge @all-same-rank
  Scenario: Player has all 4 of same rank
    Given player 1 has cards "7♥, 7♦, 7♣, 7♠, K♥"
    When player 1 plays 4 cards "7♥, 7♦, 7♣, 7♠" claiming rank "7"
    Then the move should be accepted
    And if no one challenges, the claim is accepted

  @edge @observation-after-challenge
  Scenario: Observation updates correctly after challenge
    Given player 1 has 5 cards
    And the table pile has 10 cards
    When player 1 plays 2 cards
    And player 2 challenges
    And the claim was a lie
    And player 1 picks up 12 cards
    When player 2 requests their observation
    Then player 1's hand size should show 15 (5-2+12)
    And the table pile size should show 0

  @edge @claim-history-limit
  Scenario: Claim history has reasonable limit
    Given 100 claims have been made
    When player 1 requests their observation
    Then the claim history should contain the most recent claims
    And old claims should be trimmed to prevent memory issues

  @edge @bot-no-valid-honest-move
  Scenario: Bot with no valid honest move must bluff
    Given a RuleBot for player 1
    And player 1 has cards "3♥, 3♦, 4♣, 4♠, 5♥"
    And the last claim was rank "K"
    When the bot chooses a move
    Then the bot must bluff
    And the move should claim rank "K" or higher
    And the played cards will not match the claim

  @edge @determinism-full-game
  Scenario: Full game is deterministic
    Given seed 12345
    When a full game is played with 4 Pro bots
    And the winner is recorded as "winner1"
    And the event log is recorded as "log1"
    And the game is replayed with seed 12345
    And the winner is recorded as "winner2"
    And the event log is recorded as "log2"
    Then "winner1" should equal "winner2"
    And "log1" should equal "log2"



